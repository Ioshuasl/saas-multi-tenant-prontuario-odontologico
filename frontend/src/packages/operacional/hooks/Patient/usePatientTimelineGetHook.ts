'use client';

import { useQuery } from '@tanstack/react-query';
import { operacionalQueryKeys } from '@/packages/operacional/helpers/OperacionalQueryKeys';
import { PatientTimelineGetService } from '@/packages/operacional/services/Patient/PatientTimelineGetService';

export function usePatientTimelineGetHook(patientId: string | undefined) {
  return useQuery({
    queryKey: operacionalQueryKeys.patientTimeline(patientId ?? ''),
    queryFn: () => PatientTimelineGetService(patientId!),
    enabled: Boolean(patientId),
  });
}
