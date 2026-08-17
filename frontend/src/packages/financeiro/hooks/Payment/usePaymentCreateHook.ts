'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PaymentCreateService } from '@/packages/financeiro/services/Payment/PaymentCreateService';
import type { PaymentCreateInput } from '@/packages/financeiro/types/Payment/PaymentTypes';

export function usePaymentCreateHook(installmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { paymentCreateSchema: PaymentCreateInput; idempotencyKey: string }) =>
      PaymentCreateService(installmentId, input.paymentCreateSchema, input.idempotencyKey),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['installments'] });
      void qc.invalidateQueries({ queryKey: ['patient-credit'] });
      void qc.invalidateQueries({ queryKey: ['patient-finance'] });
      void qc.invalidateQueries({ queryKey: ['cash-session-current'] });
      void qc.invalidateQueries({ queryKey: ['cash-flow'] });
    },
  });
}
