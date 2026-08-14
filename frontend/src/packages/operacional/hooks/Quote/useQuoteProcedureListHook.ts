'use client';

import { useQuery } from '@tanstack/react-query';
import { operacionalQueryKeys } from '@/packages/operacional/helpers/OperacionalQueryKeys';
import { QuoteProcedureListService } from '@/packages/operacional/services/Quote/QuoteProcedureListService';

export function useQuoteProcedureListHook() {
  return useQuery({
    queryKey: operacionalQueryKeys.procedures,
    queryFn: QuoteProcedureListService,
  });
}
