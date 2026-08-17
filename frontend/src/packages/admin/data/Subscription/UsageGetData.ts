import { apiClient } from '@/shared/api/api-client';
import type { UsageGetResult } from '@/packages/admin/types/Subscription/SubscriptionTypes';

export async function UsageGetData(): Promise<UsageGetResult> {
  return apiClient.request<UsageGetResult>('/subscription/usage');
}
