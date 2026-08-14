'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { operacionalQueryKeys } from '@/packages/operacional/helpers/OperacionalQueryKeys';
import { QuoteSendService } from '@/packages/operacional/services/Quote/QuoteSendService';
import type { QuoteSendFormValues } from '@/packages/operacional/schemas/Quote/QuoteSendSchema';

export function useQuoteSendHook(quoteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (quoteSendSchema: QuoteSendFormValues) =>
      QuoteSendService({ quoteId, quoteSendSchema }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['quotes'] });
      await queryClient.invalidateQueries({ queryKey: operacionalQueryKeys.quote(quoteId) });
      await queryClient.invalidateQueries({ queryKey: ['patient-timeline'] });
    },
  });
}
