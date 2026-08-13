import { apiClient } from '@/shared/api/api-client';
import type {
  AccountPatchInput,
  WhatsappAccountSummary,
} from '@/packages/messaging/types/Account/AccountTypes';

export async function AccountUpdateData(
  accountSchema: AccountPatchInput,
): Promise<WhatsappAccountSummary> {
  return apiClient.request<WhatsappAccountSummary>('/messaging/account', {
    method: 'PATCH',
    body: JSON.stringify(accountSchema),
  });
}
