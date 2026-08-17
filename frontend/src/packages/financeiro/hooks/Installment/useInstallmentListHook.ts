'use client';

import { useQuery } from '@tanstack/react-query';
import { financeiroQueryKeys } from '@/packages/financeiro/helpers/FinanceiroQueryKeys';
import { InstallmentListService } from '@/packages/financeiro/services/Installment/InstallmentListService';
import type { InstallmentListQuery } from '@/packages/financeiro/types/Installment/InstallmentTypes';

export function useInstallmentListHook(query: InstallmentListQuery) {
  return useQuery({
    queryKey: financeiroQueryKeys.installments(query),
    queryFn: () =>
      InstallmentListService({
        ...query,
        limit: query.limit ?? 50,
      }),
  });
}
