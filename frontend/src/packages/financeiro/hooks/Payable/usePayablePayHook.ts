'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PayablePayService } from '@/packages/financeiro/services/Payable/PayablePayService';
import type { PayablePayInput } from '@/packages/financeiro/types/Payable/PayableTypes';

export function usePayablePayHook(payableId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { payablePaySchema: PayablePayInput; idempotencyKey: string }) =>
      PayablePayService(payableId, input.payablePaySchema, input.idempotencyKey),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['payables'] });
      void qc.invalidateQueries({ queryKey: ['cash-session-current'] });
      void qc.invalidateQueries({ queryKey: ['cash-flow'] });
    },
  });
}
