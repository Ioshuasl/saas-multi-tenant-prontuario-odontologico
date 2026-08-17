import { apiClient } from '@/shared/api/api-client';
import type {
  PaymentSendReceiptInput,
  PaymentSendReceiptResult,
} from '@/packages/financeiro/types/Payment/PaymentTypes';

export async function PaymentSendReceiptData(
  paymentId: string,
  paymentSendReceiptSchema: PaymentSendReceiptInput,
): Promise<PaymentSendReceiptResult> {
  return apiClient.request<PaymentSendReceiptResult>(
    `/payments/${encodeURIComponent(paymentId)}/send-receipt`,
    {
      method: 'POST',
      body: JSON.stringify(paymentSendReceiptSchema),
    },
  );
}
