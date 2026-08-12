'use client';

import { useQuery } from '@tanstack/react-query';
import { operacionalQueryKeys } from '@/packages/operacional/helpers/OperacionalQueryKeys';
import { PatientListService } from '@/packages/operacional/services/Patient/PatientListService';

export function usePatientListHook(search: string) {
  return useQuery({
    queryKey: operacionalQueryKeys.patients(search),
    queryFn: () =>
      PatientListService({
        search: search.trim() || undefined,
        limit: 50,
      }),
  });
}
