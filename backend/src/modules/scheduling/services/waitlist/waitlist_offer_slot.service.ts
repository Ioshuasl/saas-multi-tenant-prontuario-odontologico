import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';
import {
  GetAppointmentRepository,
  GetProcedureMinutesRepository,
  GetTenantTimezoneRepository,
  ListBusyIntervalsRepository,
} from '../../repositories/appointment/appointment.repository.js';
import { ListOfferTokensBySlotRepository } from '../../repositories/public_booking_token/public_booking_token.repository.js';
import { ListRepository } from '../../repositories/waitlist/waitlist_list.repository.js';
import { UpdateManyStatusRepository } from '../../repositories/waitlist/waitlist_update.repository.js';
import { OfferAction } from '../../actions/waitlist/waitlist_offer.action.js';
import type { WaitlistOfferResult, WaitlistSummary } from '../../types/waitlist.types.js';
import {
  WAITLIST_OFFER_BATCH_SIZE,
  WAITLIST_OFFER_MAX_BATCHES,
  matchesPreferredPeriods,
} from '../../helpers/waitlist.helper.js';

export class OfferSlotService {
  constructor(
    private readonly getAppointment = new GetAppointmentRepository(),
    private readonly listWaitlist = new ListRepository(),
    private readonly listOfferTokens = new ListOfferTokensBySlotRepository(),
    private readonly updateMany = new UpdateManyStatusRepository(),
    private readonly listBusy = new ListBusyIntervalsRepository(),
    private readonly getTimezone = new GetTenantTimezoneRepository(),
    private readonly getProcedureMinutes = new GetProcedureMinutesRepository(),
    private readonly offerAction = new OfferAction(),
  ) {}

  async execute(
    ctx: RequestContext,
    appointmentId: string,
    batch = 1,
  ): Promise<{ offered: WaitlistOfferResult[]; nextBatch: boolean }> {
    if (batch > WAITLIST_OFFER_MAX_BATCHES) {
      return { offered: [], nextBatch: false };
    }

    const appointment = await this.getAppointment.execute(ctx, appointmentId);
    if (!appointment) return { offered: [], nextBatch: false };
    if (appointment.status !== 'CANCELLED' && appointment.status !== 'NO_SHOW') {
      return { offered: [], nextBatch: false };
    }

    await this.expireStaleOffers(ctx, appointmentId);

    const busy = await this.listBusy.execute(ctx, {
      unitId: appointment.unitId,
      professionalId: appointment.professionalId,
      from: new Date(appointment.startsAt),
      to: new Date(appointment.endsAt),
      excludeAppointmentId: appointment.id,
    });
    if (busy.some((b) => b.kind === 'BOOKED')) {
      return { offered: [], nextBatch: false };
    }

    const timezone = await this.getTimezone.execute(ctx);
    const waiting = await this.listWaitlist.execute(ctx, { status: 'WAITING' });
    const compatible: WaitlistSummary[] = [];
    for (const entry of waiting) {
      if (await this.isCompatible(ctx, entry, appointment, timezone)) {
        compatible.push(entry);
      }
    }

    const lote = compatible.slice(0, WAITLIST_OFFER_BATCH_SIZE);
    if (lote.length === 0) return { offered: [], nextBatch: false };

    const offered: WaitlistOfferResult[] = [];
    for (const entry of lote) {
      try {
        offered.push(
          await this.offerAction.execute(ctx, entry.id, { appointmentId }, null, batch),
        );
      } catch (err) {
        if (err instanceof AppError && err.status === 422) continue;
        throw err;
      }
    }

    const remaining = compatible.length - lote.length;
    const nextBatch = remaining > 0 && batch < WAITLIST_OFFER_MAX_BATCHES;
    return { offered, nextBatch };
  }

  private async expireStaleOffers(ctx: RequestContext, appointmentId: string): Promise<void> {
    const tokens = await this.listOfferTokens.execute(ctx, appointmentId);
    const now = Date.now();
    const staleIds = tokens
      .filter((t) => !t.usedAt && t.expiresAt.getTime() < now && t.targetId)
      .map((t) => t.targetId as string);
    const unique = [...new Set(staleIds)];
    if (unique.length > 0) {
      await this.updateMany.execute(ctx, unique, 'EXPIRED');
    }
  }

  private async isCompatible(
    ctx: RequestContext,
    entry: WaitlistSummary,
    appointment: {
      professionalId: string;
      procedureId: string | null;
      startsAt: string;
      endsAt: string;
    },
    timezone: string,
  ): Promise<boolean> {
    if (entry.professionalId && entry.professionalId !== appointment.professionalId) return false;
    if (!matchesPreferredPeriods(new Date(appointment.startsAt), entry.preferredPeriods, timezone)) {
      return false;
    }
    const slotMs = new Date(appointment.endsAt).getTime() - new Date(appointment.startsAt).getTime();
    const procedureId = entry.procedureId ?? appointment.procedureId;
    if (!procedureId) return true;
    const minutes = await this.getProcedureMinutes.execute(ctx, procedureId);
    if (minutes && minutes * 60_000 > slotMs + 1_000) return false;
    return true;
  }
}
