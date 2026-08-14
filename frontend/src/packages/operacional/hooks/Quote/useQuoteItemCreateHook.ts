'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { operacionalQueryKeys } from '@/packages/operacional/helpers/OperacionalQueryKeys';
import { QuoteItemCreateService } from '@/packages/operacional/services/Quote/QuoteItemCreateService';
import type { QuoteItemCreateInput } from '@/packages/operacional/types/Quote/QuoteTypes';

export function useQuoteItemCreateHook(quoteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (quoteItemSchema: QuoteItemCreateInput) =>
      QuoteItemCreateService(quoteId, quoteItemSchema),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['quotes'] });
      await queryClient.invalidateQueries({ queryKey: operacionalQueryKeys.quote(quoteId) });
    },
  });
}
