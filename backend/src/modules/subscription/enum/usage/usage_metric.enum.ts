/** Métricas de `usage_counter` / PlanLimitGuard. */
export const UsageMetric = {
  PROFESSIONALS: 'professionals',
  ADMIN_USERS: 'admin_users',
  UNITS: 'units',
  MESSAGES_MONTH: 'messages_month',
  STORAGE_BYTES: 'storage_bytes',
  PATIENTS: 'patients',
} as const;

export type UsageMetric = (typeof UsageMetric)[keyof typeof UsageMetric];

export const USAGE_PERIOD_CURRENT = 'CURRENT';
