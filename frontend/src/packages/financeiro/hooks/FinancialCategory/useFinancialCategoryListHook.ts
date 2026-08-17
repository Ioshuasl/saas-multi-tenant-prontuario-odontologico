'use client';

import { useQuery } from '@tanstack/react-query';
import { financeiroQueryKeys } from '@/packages/financeiro/helpers/FinanceiroQueryKeys';
import { FinancialCategoryListService } from '@/packages/financeiro/services/FinancialCategory/FinancialCategoryListService';

export function useFinancialCategoryListHook(kind?: 'REVENUE' | 'EXPENSE') {
  return useQuery({
    queryKey: financeiroQueryKeys.financialCategories(kind),
    queryFn: () => FinancialCategoryListService(kind),
  });
}
