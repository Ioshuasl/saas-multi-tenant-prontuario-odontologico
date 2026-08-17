import type { PlanSummary } from '../plan/plan.types.js';

export type SubscriptionGetResult = {
  id: string;
  status: string;
  writable: boolean;
  plan: PlanSummary;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  daysRemaining: number | null;
  contactMessage: string;
};

export type SubscriptionSnapshot = {
  id: string;
  tenantId: string;
  status: string;
  planId: string;
  currentPeriodEnd: Date | null;
  trialEndsAt: Date | null;
  plan: PlanSummary;
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
