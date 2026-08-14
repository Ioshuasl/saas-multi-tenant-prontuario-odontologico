'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QuoteCreateService } from '@/packages/operacional/services/Quote/QuoteCreateService';
import type { QuoteCreateInput } from '@/packages/operacional/types/Quote/QuoteTypes';

export function useQuoteCreateHook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (quoteSchema: QuoteCreateInput) => QuoteCreateService(quoteSchema),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['quotes'] });
      await queryClient.invalidateQueries({ queryKey: ['patient-timeline'] });
    },
  });
}
