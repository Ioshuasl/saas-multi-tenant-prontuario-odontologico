'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { operacionalQueryKeys } from '@/packages/operacional/helpers/OperacionalQueryKeys';
import type { ConsentCreateFormValues } from '@/packages/operacional/schemas/Patient/PatientSchema';
import { PatientConsentCreateService } from '@/packages/operacional/services/Patient/PatientConsentCreateService';

export function usePatientConsentCreateHook(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (consentSchema: ConsentCreateFormValues) =>
      PatientConsentCreateService(patientId, consentSchema),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: operacionalQueryKeys.patient(patientId) });
      await queryClient.invalidateQueries({
        queryKey: operacionalQueryKeys.patientConsents(patientId),
      });
    },
  });
}
