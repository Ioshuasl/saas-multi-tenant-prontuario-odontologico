import { apiClient } from '@/shared/api/api-client';
import type { WhatsappAccountSummary } from '@/packages/messaging/types/Account/AccountTypes';

export async function AccountTestData(): Promise<WhatsappAccountSummary> {
  return apiClient.request<WhatsappAccountSummary>('/messaging/account/test', {
    method: 'POST',
    headers: { 'Idempotency-Key': crypto.randomUUID() },
  });
}
