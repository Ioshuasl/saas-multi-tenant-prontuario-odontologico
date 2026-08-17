import { PayableUpdateData } from '@/packages/financeiro/data/Payable/PayableUpdateData';
import type { PayableUpdateInput } from '@/packages/financeiro/types/Payable/PayableTypes';

export async function PayableUpdateService(
  payableId: string,
  payableUpdateSchema: PayableUpdateInput,
) {
  return PayableUpdateData(payableId, payableUpdateSchema);
}
