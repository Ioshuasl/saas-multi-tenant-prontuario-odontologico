import { apiClient } from '@/shared/api/api-client';
import type { SubscriptionSummary } from '@/packages/admin/types/Subscription/SubscriptionTypes';

export async function SubscriptionGetData(): Promise<SubscriptionSummary> {
  return apiClient.request<SubscriptionSummary>('/subscription');
}
