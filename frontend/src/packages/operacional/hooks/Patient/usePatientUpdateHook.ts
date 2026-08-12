'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { operacionalQueryKeys } from '@/packages/operacional/helpers/OperacionalQueryKeys';
import type { PatientUpdateFormValues } from '@/packages/operacional/schemas/Patient/PatientSchema';
import { PatientUpdateService } from '@/packages/operacional/services/Patient/PatientUpdateService';

export function usePatientUpdateHook(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patientSchema: PatientUpdateFormValues) =>
      PatientUpdateService(patientId, patientSchema),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: operacionalQueryKeys.patient(patientId) });
      await queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}
