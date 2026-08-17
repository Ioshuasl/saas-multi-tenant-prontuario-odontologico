import { PayableListData } from '@/packages/financeiro/data/Payable/PayableListData';
import type { PayableListQuery } from '@/packages/financeiro/types/Payable/PayableTypes';

export async function PayableListService(query: PayableListQuery = {}) {
  return PayableListData(query);
}
