'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminQueryKeys } from '@/packages/admin/helpers/AdminQueryKeys';
import type { ProcedureUpdateFormValues } from '@/packages/admin/schemas/Procedure/ProcedureSchema';
import { ProcedureUpdateService } from '@/packages/admin/services/Procedure/ProcedureUpdateService';

export function useProcedureUpdateHook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      procedureId,
      procedureSchema,
    }: {
      procedureId: string;
      procedureSchema: ProcedureUpdateFormValues;
    }) => ProcedureUpdateService(procedureId, procedureSchema),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.procedures });
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.onboarding });
    },
  });
}
