import { apiClient } from '@/shared/api/api-client';
import type {
  PaymentCreateInput,
  PaymentCreateResult,
} from '@/packages/financeiro/types/Payment/PaymentTypes';

export async function PaymentCreateData(
  installmentId: string,
  paymentCreateSchema: PaymentCreateInput,
  idempotencyKey: string,
): Promise<PaymentCreateResult> {
  return apiClient.request<PaymentCreateResult>(
    `/installments/${encodeURIComponent(installmentId)}/payments`,
    {
      method: 'POST',
      body: JSON.stringify(paymentCreateSchema),
      headers: { 'Idempotency-Key': idempotencyKey },
    },
  );
}
