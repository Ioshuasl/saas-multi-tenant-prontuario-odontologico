import { apiClient } from '@/shared/api/api-client';
import type { PlanSummary } from '@/packages/admin/types/Subscription/SubscriptionTypes';

export async function PlanListData(): Promise<PlanSummary[]> {
  return apiClient.request<PlanSummary[]>('/subscription/plans');
}
