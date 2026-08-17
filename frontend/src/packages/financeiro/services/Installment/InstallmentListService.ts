import { InstallmentListData } from '@/packages/financeiro/data/Installment/InstallmentListData';
import type { InstallmentListQuery } from '@/packages/financeiro/types/Installment/InstallmentTypes';

export async function InstallmentListService(query: InstallmentListQuery = {}) {
  return InstallmentListData(query);
}
