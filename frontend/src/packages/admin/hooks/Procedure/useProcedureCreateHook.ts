'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminQueryKeys } from '@/packages/admin/helpers/AdminQueryKeys';
import { ProcedureCreateService } from '@/packages/admin/services/Procedure/ProcedureCreateService';

export function useProcedureCreateHook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ProcedureCreateService,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.procedures });
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.onboarding });
    },
  });
}
