import type { PlanLimits } from '../types/subscription.types.js';

const GB = 1024 ** 3;

export function parsePlanLimits(raw: unknown): PlanLimits {
  const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    professionals: toNullableInt(obj.professionals),
    adminUsers: toNullableInt(obj.adminUsers),
    units: toNullableInt(obj.units),
    storageGb: toNullableInt(obj.storageGb),
    messagesMonth: toNullableInt(obj.messagesMonth),
  };
}

export function storageLimitBytes(limits: PlanLimits): number | null {
  if (limits.storageGb === null) return null;
  return limits.storageGb * GB;
}

function toNullableInt(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value);
  return null;
}
