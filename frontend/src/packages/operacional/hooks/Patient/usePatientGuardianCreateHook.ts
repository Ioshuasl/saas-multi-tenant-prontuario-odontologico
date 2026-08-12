'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { operacionalQueryKeys } from '@/packages/operacional/helpers/OperacionalQueryKeys';
import type { GuardianCreateFormValues } from '@/packages/operacional/schemas/Patient/PatientSchema';
import { PatientGuardianCreateService } from '@/packages/operacional/services/Patient/PatientGuardianCreateService';

export function usePatientGuardianCreateHook(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (guardianSchema: GuardianCreateFormValues) =>
      PatientGuardianCreateService(patientId, guardianSchema),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: operacionalQueryKeys.patient(patientId) });
    },
  });
}
