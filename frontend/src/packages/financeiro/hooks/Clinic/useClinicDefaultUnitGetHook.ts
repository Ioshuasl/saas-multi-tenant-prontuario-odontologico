'use client';

import { useQuery } from '@tanstack/react-query';
import { financeiroQueryKeys } from '@/packages/financeiro/helpers/FinanceiroQueryKeys';
import { ClinicDefaultUnitGetService } from '@/packages/financeiro/services/Clinic/ClinicDefaultUnitGetService';

export function useClinicDefaultUnitGetHook() {
  return useQuery({
    queryKey: financeiroQueryKeys.clinicUnit,
    queryFn: () => ClinicDefaultUnitGetService(),
  });
}
