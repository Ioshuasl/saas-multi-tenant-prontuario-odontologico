'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CashSessionCreateService } from '@/packages/financeiro/services/CashSession/CashSessionCreateService';
import type { CashSessionCreateInput } from '@/packages/financeiro/types/CashSession/CashSessionTypes';

export function useCashSessionCreateHook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      cashSessionCreateSchema: CashSessionCreateInput;
      idempotencyKey: string;
    }) => CashSessionCreateService(input.cashSessionCreateSchema, input.idempotencyKey),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['cash-session-current'] });
    },
  });
}
