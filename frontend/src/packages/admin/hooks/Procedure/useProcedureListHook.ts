'use client';

import { useQuery } from '@tanstack/react-query';
import { adminQueryKeys } from '@/packages/admin/helpers/AdminQueryKeys';
import { ProcedureListService } from '@/packages/admin/services/Procedure/ProcedureListService';

export function useProcedureListHook() {
  return useQuery({
    queryKey: adminQueryKeys.procedures,
    queryFn: ProcedureListService,
  });
}
