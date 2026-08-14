'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { operacionalQueryKeys } from '@/packages/operacional/helpers/OperacionalQueryKeys';
import { QuoteDecisionService } from '@/packages/operacional/services/Quote/QuoteDecisionService';
import type { QuoteDecisionInput } from '@/packages/operacional/types/Quote/QuoteTypes';

export function useQuoteDecisionHook(quoteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { quoteDecisionSchema: QuoteDecisionInput; idempotencyKey: string }) =>
      QuoteDecisionService({ quoteId, ...input }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['quotes'] });
      await queryClient.invalidateQueries({ queryKey: operacionalQueryKeys.quote(quoteId) });
      await queryClient.invalidateQueries({ queryKey: ['patient-timeline'] });
    },
  });
}
