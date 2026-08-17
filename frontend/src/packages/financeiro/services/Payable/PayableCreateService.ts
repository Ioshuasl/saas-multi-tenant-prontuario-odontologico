import { PayableCreateData } from '@/packages/financeiro/data/Payable/PayableCreateData';
import type { PayableCreateInput } from '@/packages/financeiro/types/Payable/PayableTypes';

export async function PayableCreateService(payableCreateSchema: PayableCreateInput) {
  return PayableCreateData(payableCreateSchema);
}
