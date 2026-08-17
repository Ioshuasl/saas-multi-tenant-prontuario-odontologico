'use client';

import { useQuery } from '@tanstack/react-query';
import { financeiroQueryKeys } from '@/packages/financeiro/helpers/FinanceiroQueryKeys';
import { PayableListService } from '@/packages/financeiro/services/Payable/PayableListService';
import type { PayableListQuery } from '@/packages/financeiro/types/Payable/PayableTypes';

export function usePayableListHook(query: PayableListQuery = {}) {
  return useQuery({
    queryKey: financeiroQueryKeys.payables(query),
    queryFn: () => PayableListService({ ...query, limit: query.limit ?? 50 }),
  });
}
