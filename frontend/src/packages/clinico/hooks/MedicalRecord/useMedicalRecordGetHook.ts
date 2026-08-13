'use client';

import { useQuery } from '@tanstack/react-query';
import { clinicoQueryKeys } from '@/packages/clinico/helpers/ClinicoQueryKeys';
import { MedicalRecordGetService } from '@/packages/clinico/services/MedicalRecord/MedicalRecordGetService';

export function useMedicalRecordGetHook(patientId: string | undefined) {
  return useQuery({
    queryKey: clinicoQueryKeys.medicalRecord(patientId ?? ''),
    queryFn: () => MedicalRecordGetService(patientId!),
    enabled: Boolean(patientId),
    retry: false,
  });
}
