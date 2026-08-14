'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clinicoQueryKeys } from '@/packages/clinico/helpers/ClinicoQueryKeys';
import { TreatmentItemExecuteBatchService } from '@/packages/clinico/services/TreatmentPlan/TreatmentItemExecuteBatchService';
import type { TreatmentItemBatchExecuteInput } from '@/packages/clinico/types/TreatmentPlan/TreatmentPlanTypes';

export function useTreatmentItemExecuteBatchHook(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (executeSchema: TreatmentItemBatchExecuteInput) =>
      TreatmentItemExecuteBatchService(executeSchema),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: clinicoQueryKeys.treatmentPlans(patientId) });
      await queryClient.invalidateQueries({ queryKey: ['clinico-treatment-plan'] });
      await queryClient.invalidateQueries({ queryKey: clinicoQueryKeys.odontogramRoot(patientId) });
      await queryClient.invalidateQueries({ queryKey: clinicoQueryKeys.notes(patientId) });
    },
  });
}
