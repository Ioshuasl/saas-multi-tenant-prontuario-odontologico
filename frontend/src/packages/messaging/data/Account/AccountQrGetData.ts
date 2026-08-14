import { apiClient } from '@/shared/api/api-client';
import type { WhatsappAccountQr } from '@/packages/messaging/types/Account/AccountTypes';

export async function AccountQrGetData(): Promise<WhatsappAccountQr> {
  return apiClient.request<WhatsappAccountQr>('/messaging/account/qr');
}
