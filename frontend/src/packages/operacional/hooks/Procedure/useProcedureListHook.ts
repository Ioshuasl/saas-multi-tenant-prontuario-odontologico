'use client';

import { useQuery } from '@tanstack/react-query';
import { operacionalQueryKeys } from '@/packages/operacional/helpers/OperacionalQueryKeys';
import { ProcedureListService } from '@/packages/operacional/services/Procedure/ProcedureListService';

export function useProcedureListHook() {
  return useQuery({
    queryKey: operacionalQueryKeys.procedures,
    queryFn: ProcedureListService,
  });
}
