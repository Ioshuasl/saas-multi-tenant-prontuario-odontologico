import type { JobPayload } from '../../../shared/queue/job_payload.js';
import { logger } from '../../../shared/config/logger.js';
import { DetectAction } from '../actions/audit_log/audit_log_detect_anomaly.action.js';

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

export async function anomalyClinicalReadJob(payload: JobPayload): Promise<void> {
  const ctx = {
    tenantId: payload.tenantId,
    userId: SYSTEM_USER_ID,
    requestId: payload.requestId,
  };
  const written = await new DetectAction().execute(ctx);
  if (written > 0) {
    logger.info(
      { tenantId: ctx.tenantId, requestId: ctx.requestId, written },
      'anomaly_clinical_read_recorded',
    );
  }
}
