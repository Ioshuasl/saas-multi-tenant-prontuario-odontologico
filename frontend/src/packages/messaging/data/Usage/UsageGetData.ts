import { apiClient } from '@/shared/api/api-client';
import type { MessagingUsage } from '@/packages/messaging/types/Usage/UsageTypes';

export async function UsageGetData(): Promise<MessagingUsage> {
  return apiClient.request<MessagingUsage>('/messaging/usage');
}
