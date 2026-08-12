'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { operacionalQueryKeys } from '@/packages/operacional/helpers/OperacionalQueryKeys';
import { PatientDeleteService } from '@/packages/operacional/services/Patient/PatientDeleteService';

export function usePatientDeleteHook(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (confirmFutureAppointments?: boolean) =>
      PatientDeleteService(patientId, confirmFutureAppointments ?? false),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: operacionalQueryKeys.patient(patientId) });
      await queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}
