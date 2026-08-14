'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { operacionalQueryKeys } from '@/packages/operacional/helpers/OperacionalQueryKeys';
import { QuoteUpdateService } from '@/packages/operacional/services/Quote/QuoteUpdateService';
import type { QuoteUpdateInput } from '@/packages/operacional/types/Quote/QuoteTypes';

export function useQuoteUpdateHook(quoteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (quoteSchema: QuoteUpdateInput) => QuoteUpdateService(quoteId, quoteSchema),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['quotes'] });
      await queryClient.invalidateQueries({ queryKey: operacionalQueryKeys.quote(quoteId) });
      await queryClient.invalidateQueries({ queryKey: ['patient-timeline'] });
    },
  });
}
