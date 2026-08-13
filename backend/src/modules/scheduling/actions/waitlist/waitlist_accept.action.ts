import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { appendOutboxEvent } from '../../../../shared/database/outbox.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { hashToken } from '../../../../shared/helpers/token_hash.js';
import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';
import {
  AppointmentNotFoundError,
  SlotUnavailableError,
  WaitlistNotFoundError,
} from '../../models/errors/scheduling.errors.js';
import {
  FindActiveByPatientStartRepository,
  GetAppointmentRepository,
} from '../../repositories/appointment/appointment.repository.js';
import {
  GetOfferTokenByTargetRepository,
  ListOfferTokensBySlotRepository,
  ResolveTokenByHashGlobalRepository,
  UpdateTokenRepository,
} from '../../repositories/public_booking_token/public_booking_token.repository.js';
import { GetRepository as GetWaitlistRepository } from '../../repositories/waitlist/waitlist_get.repository.js';
import {
  UpdateManyStatusRepository,
  UpdateRepository as UpdateWaitlistRepository,
} from '../../repositories/waitlist/waitlist_update.repository.js';
import { CreateService as AppointmentCreateService } from '../../services/appointment/appointment_create.service.js';
import type { PublicBookingTokenRow } from '../../types/public_booking.types.js';
import type { WaitlistAcceptResult } from '../../types/waitlist.types.js';

export class AcceptAction {
  constructor(
    private readonly resolveToken = new ResolveTokenByHashGlobalRepository(),
    private readonly getTokenByTarget = new GetOfferTokenByTargetRepository(),
    private readonly updateToken = new UpdateTokenRepository(),
    private readonly listOfferTokens = new ListOfferTokensBySlotRepository(),
    private readonly getWaitlist = new GetWaitlistRepository(),
    private readonly updateWaitlist = new UpdateWaitlistRepository(),
    private readonly updateManyWaitlist = new UpdateManyStatusRepository(),
    private readonly getAppointment = new GetAppointmentRepository(),
    private readonly findByPatientStart = new FindActiveByPatientStartRepository(),
    private readonly createAppointment = new AppointmentCreateService(),
  ) {}

  async executeFromToken(requestId: string, rawToken: string): Promise<WaitlistAcceptResult> {
    const token = await this.resolveToken.execute(hashToken(rawToken));
    if (!token || token.purpose !== 'WAITLIST_OFFER') {
      throw new AppError('NOT_FOUND', 'Link inválido ou expirado.', 404);
    }
    const ctx: RequestContext = { tenantId: token.tenantId, userId: '', requestId };
    return this.finish(ctx, token);
  }

  async executeFromOfferId(ctx: RequestContext, waitlistEntryId: string): Promise<WaitlistAcceptResult> {
    const token = await this.getTokenByTarget.execute(ctx, waitlistEntryId);
    if (!token || token.purpose !== 'WAITLIST_OFFER') {
      throw new AppError('NOT_FOUND', 'Oferta da fila não encontrada.', 404);
    }
    return this.finish(ctx, token);
  }

  private async finish(
    ctx: RequestContext,
    token: PublicBookingTokenRow,
  ): Promise<WaitlistAcceptResult> {
    if (!token.targetId) {
      throw new AppError('NOT_FOUND', 'Link inválido ou expirado.', 404);
    }

    const entry = await this.getWaitlist.execute(ctx, token.targetId);
    if (!entry) throw new WaitlistNotFoundError();

    if (token.usedAt || entry.status === 'SCHEDULED') {
      return this.idempotentResult(ctx, entry.id, token.meta.cancelledAppointmentId);
    }

    if (entry.status === 'CANCELLED' || entry.status === 'EXPIRED') {
      throw new AppError('INVALID_STATE_TRANSITION', 'Esta oferta não está mais disponível.', 409);
    }

    if (token.expiresAt.getTime() < Date.now() || (entry.expiresAt && Date.parse(entry.expiresAt) < Date.now())) {
      await this.updateWaitlist.execute(ctx, entry.id, { status: 'EXPIRED' });
      await this.updateToken.execute(ctx, token.id, { usedAt: new Date() });
      throw new AppError('BUSINESS_RULE_VIOLATION', 'Oferta expirada.', 422);
    }

    const startsAt = token.meta.startsAt;
    const professionalId = token.meta.professionalId;
    const procedureId = token.meta.procedureId ?? entry.procedureId;
    if (!startsAt || !professionalId) {
      throw new AppError('VALIDATION_ERROR', 'Oferta incompleta.', 400);
    }

    let appointment;
    try {
      appointment = await this.createAppointment.execute(
        ctx,
        {
          patientId: entry.patientId,
          professionalId,
          procedureId,
          startsAt,
          endsAt: token.meta.endsAt,
          unitId: token.meta.unitId,
        },
        null,
        {
          origin: 'WAITLIST',
          status: 'SCHEDULED',
          actorType: 'PATIENT',
        },
      );
    } catch (err) {
      if (err instanceof SlotUnavailableError) {
        await this.updateWaitlist.execute(ctx, entry.id, { status: 'EXPIRED' });
        await this.updateToken.execute(ctx, token.id, { usedAt: new Date() });
      }
      throw err;
    }

    const scheduled = await this.updateWaitlist.execute(ctx, entry.id, {
      status: 'SCHEDULED',
      offeredAt: entry.offeredAt ? new Date(entry.offeredAt) : new Date(),
      expiresAt: entry.expiresAt ? new Date(entry.expiresAt) : null,
    });
    await this.updateToken.execute(ctx, token.id, { usedAt: new Date() });

    const cancelledAppointmentId = token.meta.cancelledAppointmentId;
    if (cancelledAppointmentId) {
      const siblings = await this.listOfferTokens.execute(ctx, cancelledAppointmentId);
      const loserIds = siblings
        .filter((t) => t.id !== token.id && t.targetId && t.targetId !== entry.id)
        .map((t) => t.targetId as string);
      const uniqueLosers = [...new Set(loserIds)];
      if (uniqueLosers.length > 0) {
        await this.updateManyWaitlist.execute(ctx, uniqueLosers, 'EXPIRED');
      }
      for (const sibling of siblings) {
        if (sibling.id === token.id || sibling.usedAt) continue;
        await this.updateToken.execute(ctx, sibling.id, { usedAt: new Date() });
      }
    }

    await getTenantPrisma().runInTenantContext(ctx, async (tx) => {
      await appendOutboxEvent(tx, {
        tenantId: ctx.tenantId,
        event: {
          name: 'scheduling.waitlist_offer_accepted',
          payload: {
            appointmentId: appointment.id,
            waitlistEntryId: entry.id,
            offerId: entry.id,
            requestId: ctx.requestId,
          },
        },
      });
    });

    return {
      appointment: {
        id: appointment.id,
        status: appointment.status,
        origin: appointment.origin,
        startsAt: appointment.startsAt,
        endsAt: appointment.endsAt,
        professionalId: appointment.professionalId,
        procedureId: appointment.procedureId,
        patientId: appointment.patientId,
      },
      waitlistEntry: scheduled ?? { ...entry, status: 'SCHEDULED' },
    };
  }

  private async idempotentResult(
    ctx: RequestContext,
    waitlistId: string,
    cancelledAppointmentId?: string,
  ): Promise<WaitlistAcceptResult> {
    const entry = await this.getWaitlist.execute(ctx, waitlistId);
    if (!entry) throw new WaitlistNotFoundError();

    const token = await this.getTokenByTarget.execute(ctx, waitlistId);
    let startsAt = token?.meta.startsAt;
    if (!startsAt && cancelledAppointmentId) {
      const cancelled = await this.getAppointment.execute(ctx, cancelledAppointmentId);
      startsAt = cancelled?.startsAt;
    }
    if (!startsAt) throw new AppointmentNotFoundError();

    const created = await this.findByPatientStart.execute(ctx, {
      patientId: entry.patientId,
      startsAt: new Date(startsAt),
      origin: 'WAITLIST',
    });
    if (!created) throw new AppointmentNotFoundError();

    return {
      appointment: {
        id: created.id,
        status: created.status,
        origin: created.origin,
        startsAt: created.startsAt,
        endsAt: created.endsAt,
        professionalId: created.professionalId,
        procedureId: created.procedureId,
        patientId: created.patientId,
      },
      waitlistEntry: entry,
    };
  }
}
