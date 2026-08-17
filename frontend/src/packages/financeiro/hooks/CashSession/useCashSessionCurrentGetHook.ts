'use client';

import { useQuery } from '@tanstack/react-query';
import { financeiroQueryKeys } from '@/packages/financeiro/helpers/FinanceiroQueryKeys';
import { CashSessionCurrentGetService } from '@/packages/financeiro/services/CashSession/CashSessionCurrentGetService';

export function useCashSessionCurrentGetHook(unitId: string | undefined) {
  return useQuery({
    queryKey: financeiroQueryKeys.cashSessionCurrent(unitId ?? ''),
    queryFn: () => CashSessionCurrentGetService(unitId!),
    enabled: Boolean(unitId),
    refetchInterval: 15_000,
  });
}
