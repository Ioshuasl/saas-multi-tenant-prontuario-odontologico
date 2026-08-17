'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CashSessionCloseService } from '@/packages/financeiro/services/CashSession/CashSessionCloseService';
import type { CashSessionCloseInput } from '@/packages/financeiro/types/CashSession/CashSessionTypes';

export function useCashSessionCloseHook(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      cashSessionCloseSchema: CashSessionCloseInput;
      idempotencyKey: string;
    }) => CashSessionCloseService(sessionId, input.cashSessionCloseSchema, input.idempotencyKey),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['cash-session-current'] });
    },
  });
}
