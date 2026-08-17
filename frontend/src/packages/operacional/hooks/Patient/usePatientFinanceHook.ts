'use client';

import { useQuery } from '@tanstack/react-query';
import { operacionalQueryKeys } from '@/packages/operacional/helpers/OperacionalQueryKeys';
import { PatientInstallmentListService } from '@/packages/operacional/services/Patient/PatientInstallmentListService';
import { PatientCreditGetService } from '@/packages/operacional/services/Patient/PatientCreditGetService';

export function usePatientFinanceHook(patientId: string) {
  const installments = useQuery({
    queryKey: operacionalQueryKeys.patientFinance(patientId),
    queryFn: () => PatientInstallmentListService(patientId),
    enabled: Boolean(patientId),
  });
  const credit = useQuery({
    queryKey: operacionalQueryKeys.patientCredit(patientId),
    queryFn: () => PatientCreditGetService(patientId),
    enabled: Boolean(patientId),
  });
  return { installments, credit };
}
