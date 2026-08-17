'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CashSessionMovementCreateService } from '@/packages/financeiro/services/CashSession/CashSessionMovementCreateService';
import type { CashMovementCreateInput } from '@/packages/financeiro/types/CashSession/CashSessionTypes';

export function useCashSessionMovementCreateHook(sessionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cashMovementCreateSchema: CashMovementCreateInput) =>
      CashSessionMovementCreateService(sessionId, cashMovementCreateSchema),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['cash-session-current'] });
    },
  });
}
