import { PaymentReceiptGetData } from '@/packages/financeiro/data/Payment/PaymentReceiptGetData';

export async function PaymentReceiptGetService(paymentId: string) {
  return PaymentReceiptGetData(paymentId);
}
