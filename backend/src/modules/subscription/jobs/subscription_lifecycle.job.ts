import type { JobPayload } from '../../../shared/queue/job_payload.js';
import { logger } from '../../../shared/config/logger.js';
import { ExpireService, RecalcService } from '../services/subscription/subscription_ops.service.js';

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

function ctxFrom(payload: JobPayload) {
  return {
    tenantId: payload.tenantId,
    userId: SYSTEM_USER_ID,
    requestId: payload.requestId,
  };
}

export async function expireTrialsJob(payload: JobPayload): Promise<void> {
  const result = await new ExpireService().execute(ctxFrom(payload));
  logger.info(
    { tenantId: payload.tenantId, requestId: payload.requestId, expired: result.expired },
    'subscription_trial_expire',
  );
}

export async function recalculateUsageCountersJob(payload: JobPayload): Promise<void> {
  await new RecalcService().execute(ctxFrom(payload));
  logger.info(
    { tenantId: payload.tenantId, requestId: payload.requestId },
    'subscription_usage_recalc',
  );
}
