'use client';

import { useQuery } from '@tanstack/react-query';
import { operacionalQueryKeys } from '@/packages/operacional/helpers/OperacionalQueryKeys';
import { PatientListService } from '@/packages/operacional/services/Patient/PatientListService';
import type { PatientActiveFilter } from '@/packages/operacional/types/Patient/PatientTypes';

const PAGE_SIZE = 20;

type PatientListHookOptions = {
  page?: number;
  active?: PatientActiveFilter;
  limit?: number;
};

export function usePatientListHook(search: string, options: PatientListHookOptions = {}) {
  const page = options.page ?? 1;
  const active = options.active ?? 'all';
  const limit = options.limit ?? PAGE_SIZE;

  return useQuery({
    queryKey: operacionalQueryKeys.patients(search, page, active),
    queryFn: () =>
      PatientListService({
        search: search.trim() || undefined,
        page,
        limit,
        active: active === 'all' ? undefined : active,
      }),
    placeholderData: (previous) => previous,
  });
}

export { PAGE_SIZE as PATIENT_LIST_PAGE_SIZE };
