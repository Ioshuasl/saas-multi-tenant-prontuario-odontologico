'use client';

import { useQuery } from '@tanstack/react-query';
import { financeiroQueryKeys } from '@/packages/financeiro/helpers/FinanceiroQueryKeys';
import { ProfessionalListService } from '@/packages/financeiro/services/Professional/ProfessionalListService';

export function useProfessionalListHook(enabled = true) {
  return useQuery({
    queryKey: financeiroQueryKeys.professionals,
    queryFn: () => ProfessionalListService(),
    enabled,
  });
}
