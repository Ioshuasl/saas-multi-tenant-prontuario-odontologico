export const SUBSCRIPTION_STATUSES = [
  'TRIAL',
  'ACTIVE',
  'PAST_DUE',
  'SUSPENDED',
  'EXPIRED',
  'CANCELLED',
] as const;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  TRIAL: 'Período de avaliação',
  ACTIVE: 'Ativa',
  PAST_DUE: 'Pagamento em atraso',
  SUSPENDED: 'Suspensa',
  EXPIRED: 'Expirada',
  CANCELLED: 'Cancelada',
};
