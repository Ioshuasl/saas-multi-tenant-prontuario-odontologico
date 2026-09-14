/** Status da assinatura SaaS (docs/modulos/10-billing-saas.md §3). */
export const SubscriptionStatus = {
  TRIAL: 'TRIAL',
  ACTIVE: 'ACTIVE',
  PAST_DUE: 'PAST_DUE',
  SUSPENDED: 'SUSPENDED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
} as const;

export type SubscriptionStatus =
  (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

export const READ_ONLY_SUBSCRIPTION_STATUSES: ReadonlySet<string> = new Set([
  SubscriptionStatus.SUSPENDED,
  SubscriptionStatus.EXPIRED,
  SubscriptionStatus.CANCELLED,
]);

export const OPS_SUBSCRIPTION_STATUSES = [
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.SUSPENDED,
  SubscriptionStatus.PAST_DUE,
  SubscriptionStatus.CANCELLED,
  SubscriptionStatus.TRIAL,
  SubscriptionStatus.EXPIRED,
] as const;
