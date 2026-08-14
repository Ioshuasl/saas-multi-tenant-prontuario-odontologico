'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { operacionalQueryKeys } from '@/packages/operacional/helpers/OperacionalQueryKeys';
import { QuoteItemDeleteService } from '@/packages/operacional/services/Quote/QuoteItemDeleteService';

export function useQuoteItemDeleteHook(quoteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => QuoteItemDeleteService(quoteId, itemId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['quotes'] });
      await queryClient.invalidateQueries({ queryKey: operacionalQueryKeys.quote(quoteId) });
    },
  });
}
