'use client';

import { useQuery } from '@tanstack/react-query';
import { publicQueryKeys } from '@/packages/public/helpers/PublicQueryKeys';
import { QuoteGetService } from '@/packages/public/services/Quote/QuoteGetService';

export function useQuoteGetHook(token: string) {
  return useQuery({
    queryKey: publicQueryKeys.quote(token),
    queryFn: () => QuoteGetService(token),
    enabled: Boolean(token),
    retry: false,
  });
}
