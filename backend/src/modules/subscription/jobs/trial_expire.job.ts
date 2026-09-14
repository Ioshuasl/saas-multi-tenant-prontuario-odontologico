import type { JobPayload } from '../../../shared/queue/job_payload.js';
import { logger } from '../../../shared/config/logger.js';
import { AuditAction, writeAuditLogSafe } from '../../../shared/database/write_audit.js';
import { disableAllAutomations } from '../../messaging/messaging_public.js';
import { SubscriptionStatus } from '../enum/subscription/subscription_status.enum.js';
import { ListExpiredTrialsRepository } from '../repositories/subscription/subscription_list_expired_trials.repository.js';
import { UpdateStatusRepository } from '../repositories/subscription/subscription_update_status.repository.js';

/**
 * Expira trials vencidos → EXPIRED; desliga automações.
 * Idempotente: só altera status TRIAL com trial_ends_at <= now.
 */
export async function trialExpireJob(payload: JobPayload): Promise<void> {
  const listExpired = new ListExpiredTrialsRepository();
  const updateStatus = new UpdateStatusRepository();
  const now = new Date();
  const expired = await listExpired.execute(now);
  const filterTenant =
    payload.tenantId && payload.tenantId !== '00000000-0000-0000-0000-000000000000'
      ? payload.tenantId
      : null;

  for (const row of expired) {
    if (filterTenant && filterTenant !== row.tenantId) continue;

    const ctx = {
      tenantId: row.tenantId,
      userId: '00000000-0000-0000-0000-000000000000',
      requestId: payload.requestId ?? `trial-expire:${row.tenantId}`,
    };

    const updated = await updateStatus.execute(ctx, SubscriptionStatus.EXPIRED);
    if (!updated) continue;

    await disableAllAutomations(ctx);
    await writeAuditLogSafe({
      tenantId: row.tenantId,
      actorType: 'SYSTEM',
      action: AuditAction.SUBSCRIPTION_STATUS_CHANGED,
      resourceType: 'subscription',
      resourceId: updated.id,
      metadata: { status: SubscriptionStatus.EXPIRED, source: 'trial-expire-job' },
    });

    logger.info(
      { tenantId: row.tenantId, subscriptionId: updated.id, requestId: ctx.requestId },
      'subscription_trial_expired',
    );
  }
}
