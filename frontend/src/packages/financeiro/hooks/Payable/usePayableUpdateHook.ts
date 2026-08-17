'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PayableUpdateService } from '@/packages/financeiro/services/Payable/PayableUpdateService';
import type { PayableUpdateInput } from '@/packages/financeiro/types/Payable/PayableTypes';

export function usePayableUpdateHook(payableId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payableUpdateSchema: PayableUpdateInput) =>
      PayableUpdateService(payableId, payableUpdateSchema),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['payables'] });
    },
  });
}
