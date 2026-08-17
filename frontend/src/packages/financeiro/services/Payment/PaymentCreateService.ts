import { PaymentCreateData } from '@/packages/financeiro/data/Payment/PaymentCreateData';
import type { PaymentCreateInput } from '@/packages/financeiro/types/Payment/PaymentTypes';

export async function PaymentCreateService(
  installmentId: string,
  paymentCreateSchema: PaymentCreateInput,
  idempotencyKey: string,
) {
  return PaymentCreateData(installmentId, paymentCreateSchema, idempotencyKey);
}
