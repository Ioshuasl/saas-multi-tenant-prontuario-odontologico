'use client';

import { useMutation } from '@tanstack/react-query';
import { InstallmentChargeService } from '@/packages/financeiro/services/Installment/InstallmentChargeService';
import type { InstallmentChargeInput } from '@/packages/financeiro/types/Report/ReportTypes';

export function useInstallmentChargeHook() {
  return useMutation({
    mutationFn: (input: {
      installmentId: string;
      installmentChargeSchema: InstallmentChargeInput;
    }) => InstallmentChargeService(input.installmentId, input.installmentChargeSchema),
  });
}
