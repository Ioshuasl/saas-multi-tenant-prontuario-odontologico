'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QuoteDuplicateService } from '@/packages/operacional/services/Quote/QuoteDuplicateService';

export function useQuoteDuplicateHook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (quoteId: string) => QuoteDuplicateService(quoteId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['quotes'] });
      await queryClient.invalidateQueries({ queryKey: ['patient-timeline'] });
    },
  });
}
