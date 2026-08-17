import type { SubscriptionStatus } from '@/packages/admin/enum/Subscription/SubscriptionStatusEnum';

export type PlanLimits = {
  professionals: number | null;
  users: number | null;
  units: number | null;
  storageGb: number | null;
  monthlyMessages: number | null;
};

export type PlanSummary = {
  id: string;
  code: string;
  name: string;
  priceCents: number;
  interval: string;
  limits: PlanLimits;
  active: boolean;
};

export type SubscriptionGetResult = {
  id: string;
  status: SubscriptionStatus;
  writable: boolean;
  plan: PlanSummary;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  daysRemaining: number | null;
  contactMessage: string;
};

export type UsageMetricSnapshot = {
  metric: string;
  current: number;
  limit: number | null;
};

export type UsageGetResult = {
  professionals: UsageMetricSnapshot;
  users: UsageMetricSnapshot;
  units: UsageMetricSnapshot;
  storageBytes: UsageMetricSnapshot;
  messagesMonth: UsageMetricSnapshot;
};
