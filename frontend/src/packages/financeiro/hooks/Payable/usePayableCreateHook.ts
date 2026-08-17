'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PayableCreateService } from '@/packages/financeiro/services/Payable/PayableCreateService';
import type { PayableCreateInput } from '@/packages/financeiro/types/Payable/PayableTypes';

export function usePayableCreateHook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payableCreateSchema: PayableCreateInput) =>
      PayableCreateService(payableCreateSchema),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['payables'] });
    },
  });
}
