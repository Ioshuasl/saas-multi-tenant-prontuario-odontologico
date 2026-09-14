import type { JobPayload } from '../../../shared/queue/job_payload.js';
import { logger } from '../../../shared/config/logger.js';
import { AnonymizeAction } from '../actions/data_subject_request/data_subject_request_anonymize.action.js';

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

export async function patientAnonymizeJob(payload: JobPayload): Promise<void> {
  const dsrId = typeof payload.dsrId === 'string' ? payload.dsrId : '';
  if (!dsrId) return;

  const ctx = {
    tenantId: payload.tenantId,
    userId: SYSTEM_USER_ID,
    requestId: payload.requestId,
  };

  await new AnonymizeAction().execute(ctx, dsrId);
  logger.info({ tenantId: ctx.tenantId, dsrId, requestId: ctx.requestId }, 'patient_anonymize_done');
}
