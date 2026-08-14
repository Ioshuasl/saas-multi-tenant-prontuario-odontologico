'use client';

import { useQuery } from '@tanstack/react-query';
import { operacionalQueryKeys } from '@/packages/operacional/helpers/OperacionalQueryKeys';
import { QuoteGetService } from '@/packages/operacional/services/Quote/QuoteGetService';

export function useQuoteGetHook(quoteId?: string) {
  return useQuery({
    queryKey: operacionalQueryKeys.quote(quoteId ?? ''),
    queryFn: () => QuoteGetService(quoteId!),
    enabled: Boolean(quoteId),
  });
}
