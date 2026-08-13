'use client';

import { useQuery } from '@tanstack/react-query';
import { operacionalQueryKeys } from '@/packages/operacional/helpers/OperacionalQueryKeys';
import { MedicalRecordGetService } from '@/packages/operacional/services/MedicalRecord/MedicalRecordGetService';

export function useMedicalRecordGetHook(patientId: string | undefined) {
  return useQuery({
    queryKey: operacionalQueryKeys.medicalRecord(patientId ?? ''),
    queryFn: () => MedicalRecordGetService(patientId!),
    enabled: Boolean(patientId),
  });
}
