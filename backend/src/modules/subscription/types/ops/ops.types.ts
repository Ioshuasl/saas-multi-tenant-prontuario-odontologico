import type { PlanCode } from '../../enum/plan/plan_code.enum.js';
import type { SubscriptionStatus } from '../../enum/subscription/subscription_status.enum.js';

export type OpsUpdateInput = {
  status?: SubscriptionStatus;
  planCode?: PlanCode;
};
