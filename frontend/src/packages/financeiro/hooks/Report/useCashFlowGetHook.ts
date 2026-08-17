'use client';

import { useQuery } from '@tanstack/react-query';
import { financeiroQueryKeys } from '@/packages/financeiro/helpers/FinanceiroQueryKeys';
import { CashFlowGetService } from '@/packages/financeiro/services/Report/CashFlowGetService';
import type { CashFlowQuery } from '@/packages/financeiro/types/Report/ReportTypes';

export function useCashFlowGetHook(query: CashFlowQuery, enabled = true) {
  return useQuery({
    queryKey: financeiroQueryKeys.cashFlow(query),
    queryFn: () => CashFlowGetService(query),
    enabled: enabled && Boolean(query.from && query.to && query.basis),
  });
}
