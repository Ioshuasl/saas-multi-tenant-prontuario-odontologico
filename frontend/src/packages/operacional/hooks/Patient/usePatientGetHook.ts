'use client';

import { useQuery } from '@tanstack/react-query';
import { operacionalQueryKeys } from '@/packages/operacional/helpers/OperacionalQueryKeys';
import { PatientGetService } from '@/packages/operacional/services/Patient/PatientGetService';

export function usePatientGetHook(patientId: string | undefined) {
  return useQuery({
    queryKey: operacionalQueryKeys.patient(patientId ?? ''),
    queryFn: () => PatientGetService(patientId!),
    enabled: Boolean(patientId),
  });
}
