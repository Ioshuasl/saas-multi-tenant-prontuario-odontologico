'use client';

import { useQuery } from '@tanstack/react-query';
import { clinicoQueryKeys } from '@/packages/clinico/helpers/ClinicoQueryKeys';
import { PatientGetService } from '@/packages/clinico/services/Patient/PatientGetService';

export function usePatientGetHook(patientId: string | undefined) {
  return useQuery({
    queryKey: clinicoQueryKeys.patient(patientId ?? ''),
    queryFn: () => PatientGetService(patientId!),
    enabled: Boolean(patientId),
  });
}
