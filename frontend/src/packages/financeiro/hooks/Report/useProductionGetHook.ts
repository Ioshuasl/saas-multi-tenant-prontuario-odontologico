'use client';

import { useQuery } from '@tanstack/react-query';
import { financeiroQueryKeys } from '@/packages/financeiro/helpers/FinanceiroQueryKeys';
import { ProductionGetService } from '@/packages/financeiro/services/Report/ProductionGetService';
import type { ProductionQuery } from '@/packages/financeiro/types/Report/ReportTypes';

export function useProductionGetHook(query: ProductionQuery, enabled = true) {
  return useQuery({
    queryKey: financeiroQueryKeys.production(query),
    queryFn: () => ProductionGetService(query),
    enabled: enabled && Boolean(query.from && query.to),
  });
}
