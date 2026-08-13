import type { JobPayload } from '../../../shared/queue/job_payload.js';
import { logger } from '../../../shared/config/logger.js';
import type { RequestContext } from '../../../shared/domain/request_context.js';
import { OfferSlotService } from '../services/waitlist/waitlist_offer_slot.service.js';
import { WAITLIST_OFFER_TTL_MS } from '../helpers/waitlist.helper.js';

export type ScheduleNextWaitlistBatch = (
  payload: JobPayload,
  delayMs: number,
) => Promise<void>;

const offerSlot = new OfferSlotService();

export async function offerWaitlistSlotJob(
  payload: JobPayload,
  scheduleNext?: ScheduleNextWaitlistBatch,
): Promise<void> {
  const appointmentId = typeof payload.appointmentId === 'string' ? payload.appointmentId : null;
  if (!appointmentId) {
    logger.warn({ tenantId: payload.tenantId, requestId: payload.requestId }, 'offer_waitlist_missing_appointment');
    return;
  }

  const batch = typeof payload.batch === 'number' && payload.batch >= 1 ? payload.batch : 1;
  const ctx: RequestContext = {
    tenantId: payload.tenantId,
    userId: '',
    requestId: payload.requestId,
  };

  const result = await offerSlot.execute(ctx, appointmentId, batch);
  logger.info(
    {
      tenantId: payload.tenantId,
      requestId: payload.requestId,
      appointmentId,
      batch,
      offered: result.offered.length,
      nextBatch: result.nextBatch,
    },
    'offer_waitlist_slot_done',
  );

  if (result.nextBatch && scheduleNext) {
    await scheduleNext(
      {
        tenantId: payload.tenantId,
        requestId: payload.requestId,
        appointmentId,
        batch: batch + 1,
      },
      WAITLIST_OFFER_TTL_MS,
    );
  }
}
