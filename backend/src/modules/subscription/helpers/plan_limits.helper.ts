import type { PlanLimits } from '../types/plan/plan.types.js';
import { UsageMetric } from '../enum/usage/usage_metric.enum.js';

const BYTES_PER_GB = 1024 * 1024 * 1024;

export function parsePlanLimits(value: unknown): PlanLimits {
  const row = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  return {
    professionals: toLimit(row.professionals),
    users: toLimit(row.users),
    units: toLimit(row.units),
    storageGb: toLimit(row.storageGb),
    monthlyMessages: toLimit(row.monthlyMessages),
  };
}

export function limitForMetric(limits: PlanLimits, metric: UsageMetric): number | null {
  switch (metric) {
    case UsageMetric.PROFESSIONALS:
      return limits.professionals;
    case UsageMetric.USERS:
      return limits.users;
    case UsageMetric.UNITS:
      return limits.units;
    case UsageMetric.STORAGE_BYTES:
      return limits.storageGb === null ? null : limits.storageGb * BYTES_PER_GB;
    case UsageMetric.MESSAGES_MONTH:
      return limits.monthlyMessages;
    default:
      return null;
  }
}

export function currentPeriodKey(now = new Date()): string {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function toLimit(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return null;
}
