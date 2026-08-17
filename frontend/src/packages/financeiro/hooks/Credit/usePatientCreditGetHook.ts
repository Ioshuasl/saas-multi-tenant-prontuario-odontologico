'use client';

import { useQuery } from '@tanstack/react-query';
import { financeiroQueryKeys } from '@/packages/financeiro/helpers/FinanceiroQueryKeys';
import { PatientCreditGetService } from '@/packages/financeiro/services/Credit/PatientCreditGetService';

export function usePatientCreditGetHook(patientId: string) {
  return useQuery({
    queryKey: financeiroQueryKeys.patientCredit(patientId),
    queryFn: () => PatientCreditGetService(patientId),
    enabled: Boolean(patientId),
  });
}
