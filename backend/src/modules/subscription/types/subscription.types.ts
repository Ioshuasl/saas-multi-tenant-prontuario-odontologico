import type { PlanCode } from '../enum/plan/plan_code.enum.js';
import type { SubscriptionStatus } from '../enum/subscription/subscription_status.enum.js';
import type { UsageMetric } from '../enum/usage/usage_metric.enum.js';

export type PlanLimits = {
  professionals: number | null;
  adminUsers: number | null;
  units: number | null;
  storageGb: number | null;
  messagesMonth: number | null;
};

export type PlanSummary = {
  id: string;
  code: PlanCode | string;
  name: string;
  priceCents: number;
  interval: string;
  limits: PlanLimits;
  active: boolean;
};

export type SubscriptionSummary = {
  id: string;
  tenantId: string;
  status: SubscriptionStatus | string;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelAt: string | null;
  plan: PlanSummary;
  createdAt: string;
  updatedAt: string;
};

export type UsageItem = {
  metric: UsageMetric | string;
  current: number;
  limit: number | null;
  period: string;
};

export type UsageSummary = {
  items: UsageItem[];
};
