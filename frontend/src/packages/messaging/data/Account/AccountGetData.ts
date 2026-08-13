import { apiClient } from '@/shared/api/api-client';
import type { WhatsappAccountSummary } from '@/packages/messaging/types/Account/AccountTypes';

export async function AccountGetData(): Promise<WhatsappAccountSummary> {
  return apiClient.request<WhatsappAccountSummary>('/messaging/account');
}
