import { PaymentSendReceiptData } from '@/packages/financeiro/data/Payment/PaymentSendReceiptData';
import type { PaymentSendReceiptInput } from '@/packages/financeiro/types/Payment/PaymentTypes';

export async function PaymentSendReceiptService(
  paymentId: string,
  paymentSendReceiptSchema: PaymentSendReceiptInput,
) {
  return PaymentSendReceiptData(paymentId, paymentSendReceiptSchema);
}
