'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clinicoQueryKeys } from '@/packages/clinico/helpers/ClinicoQueryKeys';
import { TreatmentItemExecuteService } from '@/packages/clinico/services/TreatmentPlan/TreatmentItemExecuteService';
import type { TreatmentItemExecuteInput } from '@/packages/clinico/types/TreatmentPlan/TreatmentPlanTypes';

export function useTreatmentItemExecuteHook(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { itemId: string; executeSchema: TreatmentItemExecuteInput }) =>
      TreatmentItemExecuteService(input.itemId, input.executeSchema),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: clinicoQueryKeys.treatmentPlans(patientId) });
      await queryClient.invalidateQueries({ queryKey: ['clinico-treatment-plan'] });
      await queryClient.invalidateQueries({ queryKey: clinicoQueryKeys.odontogramRoot(patientId) });
      await queryClient.invalidateQueries({ queryKey: clinicoQueryKeys.notes(patientId) });
    },
  });
}
