import { apiClient } from '@/shared/api/api-client';
import type {
  AccountConnectInput,
  WhatsappAccountSummary,
} from '@/packages/messaging/types/Account/AccountTypes';

export async function AccountCreateData(
  accountSchema: AccountConnectInput,
): Promise<WhatsappAccountSummary> {
  return apiClient.request<WhatsappAccountSummary>('/messaging/account', {
    method: 'POST',
    body: JSON.stringify(accountSchema),
  });
}
