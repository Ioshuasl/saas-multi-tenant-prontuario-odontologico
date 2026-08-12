'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminQueryKeys } from '@/packages/admin/helpers/AdminQueryKeys';
import { ProcedureImportCatalogService } from '@/packages/admin/services/Procedure/ProcedureImportCatalogService';

export function useProcedureImportCatalogHook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ProcedureImportCatalogService,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.procedures });
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.onboarding });
    },
  });
}
