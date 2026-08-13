import { randomBytes } from 'node:crypto';
import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { env } from '../../../../shared/config/env.js';
import { appendOutboxEvent } from '../../../../shared/database/outbox.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { hashToken } from '../../../../shared/helpers/token_hash.js';
import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';
import {
  AppointmentNotFoundError,
  WaitlistNotFoundError,
} from '../../models/errors/scheduling.errors.js';
import {
  GetAppointmentRepository,
  GetProcedureMinutesRepository,
  GetTenantTimezoneRepository,
} from '../../repositories/appointment/appointment.repository.js';
import {
  CreateTokenRepository,
  FindOfferTokenByIdempotencyRepository,
} from '../../repositories/public_booking_token/public_booking_token.repository.js';
import { GetRepository as GetWaitlistRepository } from '../../repositories/waitlist/waitlist_get.repository.js';
import { UpdateRepository as UpdateWaitlistRepository } from '../../repositories/waitlist/waitlist_update.repository.js';
import type { WaitlistOfferSchema } from '../../schemas/waitlist.schema.js';
import type { WaitlistOfferResult, WaitlistSummary } from '../../types/waitlist.types.js';
import {
  WAITLIST_OFFER_TTL_MS,
  matchesPreferredPeriods,
  waitlistOfferButtonPayload,
} from '../../helpers/waitlist.helper.js';

export class OfferAction {
  constructor(
    private readonly getAppointment = new GetAppointmentRepository(),
    private readonly getWaitlist = new GetWaitlistRepository(),
    private readonly updateWaitlist = new UpdateWaitlistRepository(),
    private readonly getTimezone = new GetTenantTimezoneRepository(),
    private readonly getProcedureMinutes = new GetProcedureMinutesRepository(),
    private readonly createToken = new CreateTokenRepository(),
    private readonly findIdempotency = new FindOfferTokenByIdempotencyRepository(),
  ) {}

  async execute(
    ctx: RequestContext,
    waitlistId: string,
    offerSchema: WaitlistOfferSchema,
    idempotencyKey?: string | null,
    batch = 1,
  ): Promise<WaitlistOfferResult> {
    if (idempotencyKey) {
      const existing = await this.findIdempotency.execute(ctx, idempotencyKey);
      if (existing?.targetId) {
        const entry = await this.getWaitlist.execute(ctx, existing.targetId);
        if (entry) {
          return this.toResult(entry, existing.expiresAt.toISOString());
        }
      }
    }

    const entry = await this.getWaitlist.execute(ctx, waitlistId);
    if (!entry) throw new WaitlistNotFoundError();
    if (entry.status === 'CANCELLED' || entry.status === 'EXPIRED' || entry.status === 'SCHEDULED') {
      throw new AppError(
        'BUSINESS_RULE_VIOLATION',
        'Esta entrada da fila não pode receber oferta.',
        422,
      );
    }

    const appointment = await this.getAppointment.execute(ctx, offerSchema.appointmentId);
    if (!appointment) throw new AppointmentNotFoundError();
    if (appointment.status !== 'CANCELLED' && appointment.status !== 'NO_SHOW') {
      throw new AppError(
        'BUSINESS_RULE_VIOLATION',
        'Só é possível oferecer um horário cancelado ou com falta.',
        422,
      );
    }

    await this.assertCompatible(ctx, entry, appointment);

    const expiresAt = new Date(Date.now() + WAITLIST_OFFER_TTL_MS);
    const updated = await this.updateWaitlist.execute(ctx, entry.id, {
      status: 'OFFERED',
      offeredAt: new Date(),
      expiresAt,
    });
    if (!updated) throw new WaitlistNotFoundError();

    const rawToken = randomBytes(24).toString('base64url');
    await this.createToken.execute(ctx, {
      purpose: 'WAITLIST_OFFER',
      tokenHash: hashToken(rawToken),
      expiresAt,
      targetId: entry.id,
      meta: {
        waitlistEntryId: entry.id,
        cancelledAppointmentId: appointment.id,
        unitId: appointment.unitId,
        professionalId: appointment.professionalId,
        procedureId: entry.procedureId ?? appointment.procedureId ?? undefined,
        startsAt: appointment.startsAt,
        endsAt: appointment.endsAt,
        batch,
        ...(idempotencyKey ? { idempotencyKey } : {}),
      },
    });

    await getTenantPrisma().runInTenantContext(ctx, async (tx) => {
      await appendOutboxEvent(tx, {
        tenantId: ctx.tenantId,
        event: {
          name: 'scheduling.waitlist_offer_sent',
          payload: {
            appointmentId: appointment.id,
            waitlistEntryId: entry.id,
            offerId: entry.id,
            patientId: entry.patientId,
            buttonPayload: waitlistOfferButtonPayload(entry.id),
            acceptToken: rawToken,
            template: 'waitlist_offer',
            requestId: ctx.requestId,
          },
        },
      });
    });

    return this.toResult(updated, expiresAt.toISOString(), rawToken);
  }

  private async assertCompatible(
    ctx: RequestContext,
    entry: WaitlistSummary,
    appointment: { professionalId: string; procedureId: string | null; startsAt: string; endsAt: string },
  ): Promise<void> {
    if (entry.professionalId && entry.professionalId !== appointment.professionalId) {
      throw new AppError(
        'BUSINESS_RULE_VIOLATION',
        'Profissional da vaga não combina com a preferência da fila.',
        422,
      );
    }

    const slotMs = new Date(appointment.endsAt).getTime() - new Date(appointment.startsAt).getTime();
    const procedureId = entry.procedureId ?? appointment.procedureId;
    if (procedureId) {
      const minutes = await this.getProcedureMinutes.execute(ctx, procedureId);
      if (minutes && minutes * 60_000 > slotMs + 1_000) {
        throw new AppError(
          'BUSINESS_RULE_VIOLATION',
          'Duração do procedimento não cabe neste horário.',
          422,
        );
      }
    }

    const timezone = await this.getTimezone.execute(ctx);
    if (!matchesPreferredPeriods(new Date(appointment.startsAt), entry.preferredPeriods, timezone)) {
      throw new AppError(
        'BUSINESS_RULE_VIOLATION',
        'Horário fora dos períodos preferidos da fila.',
        422,
      );
    }
  }

  private toResult(entry: WaitlistSummary, expiresAt: string, acceptToken?: string): WaitlistOfferResult {
    return {
      waitlistEntry: entry,
      offerId: entry.id,
      buttonPayload: waitlistOfferButtonPayload(entry.id),
      expiresAt,
      template: 'waitlist_offer',
      ...(env.NODE_ENV === 'test' && acceptToken ? { acceptToken } : {}),
    };
  }
}
