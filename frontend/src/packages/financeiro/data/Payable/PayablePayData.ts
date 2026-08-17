import { apiClient } from '@/shared/api/api-client';
import type {
  PayablePayInput,
  PayablePayResult,
} from '@/packages/financeiro/types/Payable/PayableTypes';

export async function PayablePayData(
  payableId: string,
  payablePaySchema: PayablePayInput,
  idempotencyKey: string,
): Promise<PayablePayResult> {
  return apiClient.request<PayablePayResult>(`/payables/${encodeURIComponent(payableId)}/pay`, {
    method: 'POST',
    body: JSON.stringify(payablePaySchema),
    headers: { 'Idempotency-Key': idempotencyKey },
  });
}
