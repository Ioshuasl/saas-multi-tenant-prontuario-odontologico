import type { JobPayload } from '../../../shared/queue/job_payload.js';
import { UsageMetric } from '../enum/usage/usage_metric.enum.js';
import { CountLiveRepository } from '../repositories/usage/usage_count_live.repository.js';
import { UpsertRepository } from '../repositories/usage/usage_upsert.repository.js';

const METRICS: UsageMetric[] = [
  UsageMetric.PROFESSIONALS,
  UsageMetric.ADMIN_USERS,
  UsageMetric.UNITS,
  UsageMetric.STORAGE_BYTES,
  UsageMetric.MESSAGES_MONTH,
  UsageMetric.PATIENTS,
];

/** Recalcula usage_counter a partir do estado real do tenant. */
export async function recalculateUsageCountersJob(payload: JobPayload): Promise<void> {
  if (!payload.tenantId) return;
  const ctx = {
    tenantId: payload.tenantId,
    userId: '00000000-0000-0000-0000-000000000000',
    requestId: payload.requestId ?? `usage-recalc:${payload.tenantId}`,
  };
  const countLive = new CountLiveRepository();
  const upsert = new UpsertRepository();

  for (const metric of METRICS) {
    const value = await countLive.execute(ctx, metric);
    const period =
      metric === UsageMetric.MESSAGES_MONTH ? currentMonthPeriod() : 'CURRENT';
    await upsert.execute(ctx, metric, value, period);
  }
}

function currentMonthPeriod(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}
