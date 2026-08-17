import { PayablePayData } from '@/packages/financeiro/data/Payable/PayablePayData';
import type { PayablePayInput } from '@/packages/financeiro/types/Payable/PayableTypes';

export async function PayablePayService(
  payableId: string,
  payablePaySchema: PayablePayInput,
  idempotencyKey: string,
) {
  return PayablePayData(payableId, payablePaySchema, idempotencyKey);
}
