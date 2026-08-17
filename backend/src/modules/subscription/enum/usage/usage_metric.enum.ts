export const UsageMetric = {
  PROFESSIONALS: 'PROFESSIONALS',
  USERS: 'USERS',
  UNITS: 'UNITS',
  STORAGE_BYTES: 'STORAGE_BYTES',
  MESSAGES_MONTH: 'MESSAGES_MONTH',
} as const;

export type UsageMetric = (typeof UsageMetric)[keyof typeof UsageMetric];

export const USAGE_METRICS = Object.values(UsageMetric);

export const ADMIN_USER_ROLES = ['OWNER', 'RECEPTION', 'FINANCE', 'ASSISTANT'] as const;
