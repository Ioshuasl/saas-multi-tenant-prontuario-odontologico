'use client';

import { useQuery } from '@tanstack/react-query';
import { financeiroQueryKeys } from '@/packages/financeiro/helpers/FinanceiroQueryKeys';
import { OverdueGetService } from '@/packages/financeiro/services/Report/OverdueGetService';

export function useOverdueGetHook(unitId?: string) {
  return useQuery({
    queryKey: financeiroQueryKeys.overdue(unitId),
    queryFn: () => OverdueGetService(unitId),
  });
}
