import { apiClient } from '@/shared/api/api-client';
import type { SubscriptionGetResult } from '@/packages/admin/types/Subscription/SubscriptionTypes';

export async function SubscriptionGetData(): Promise<SubscriptionGetResult> {
  return apiClient.request<SubscriptionGetResult>('/subscription');
}
