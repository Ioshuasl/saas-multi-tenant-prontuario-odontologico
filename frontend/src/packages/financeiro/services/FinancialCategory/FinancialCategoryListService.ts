import { FinancialCategoryListData } from '@/packages/financeiro/data/FinancialCategory/FinancialCategoryListData';

export async function FinancialCategoryListService(kind?: 'REVENUE' | 'EXPENSE') {
  return FinancialCategoryListData(kind);
}
