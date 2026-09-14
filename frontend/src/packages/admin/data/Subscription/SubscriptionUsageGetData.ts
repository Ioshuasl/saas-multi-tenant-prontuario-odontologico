import { apiClient } from '@/shared/api/api-client';
import type { UsageSummary } from '@/packages/admin/types/Subscription/SubscriptionTypes';

export async function SubscriptionUsageGetData(): Promise<UsageSummary> {
  return apiClient.request<UsageSummary>('/subscription/usage');
}
