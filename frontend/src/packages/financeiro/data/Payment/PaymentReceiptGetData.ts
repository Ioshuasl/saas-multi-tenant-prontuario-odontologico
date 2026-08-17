import { apiClient } from '@/shared/api/api-client';
import type { PaymentReceiptResult } from '@/packages/financeiro/types/Payment/PaymentTypes';

export async function PaymentReceiptGetData(paymentId: string): Promise<PaymentReceiptResult> {
  return apiClient.request<PaymentReceiptResult>(
    `/payments/${encodeURIComponent(paymentId)}/receipt`,
  );
}
