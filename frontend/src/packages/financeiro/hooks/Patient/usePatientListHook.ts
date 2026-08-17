'use client';

import { useQuery } from '@tanstack/react-query';
import { financeiroQueryKeys } from '@/packages/financeiro/helpers/FinanceiroQueryKeys';
import { PatientListService } from '@/packages/financeiro/services/Patient/PatientListService';

export function usePatientListHook(search: string) {
  return useQuery({
    queryKey: financeiroQueryKeys.patients(search),
    queryFn: () => PatientListService(search),
  });
}
