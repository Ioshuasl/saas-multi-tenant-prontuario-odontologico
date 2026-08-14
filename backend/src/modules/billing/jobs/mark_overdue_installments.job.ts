import type { JobPayload } from '../../../shared/queue/job_payload.js';
import { logger } from '../../../shared/config/logger.js';
import { MarkOverdueService } from '../services/installment/installment_mark_overdue.service.js';

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

export async function markOverdueInstallmentsJob(payload: JobPayload): Promise<void> {
  const ctx = {
    tenantId: payload.tenantId,
    userId: SYSTEM_USER_ID,
    requestId: payload.requestId,
  };
  const count = await new MarkOverdueService().execute(ctx);
  logger.info({ tenantId: ctx.tenantId, requestId: ctx.requestId, count }, 'installments_marked_overdue');
}
