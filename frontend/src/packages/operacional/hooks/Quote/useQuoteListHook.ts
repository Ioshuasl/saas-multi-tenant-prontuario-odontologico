'use client';

import { useQuery } from '@tanstack/react-query';
import { operacionalQueryKeys } from '@/packages/operacional/helpers/OperacionalQueryKeys';
import { QuoteListService } from '@/packages/operacional/services/Quote/QuoteListService';
import type { QuoteStatus } from '@/packages/operacional/enum/Quote/QuoteStatusEnum';

export function useQuoteListHook(query: { patientId?: string; status?: QuoteStatus }) {
  return useQuery({
    queryKey: operacionalQueryKeys.quotes(query.patientId, query.status),
    queryFn: () =>
      QuoteListService({
        patientId: query.patientId,
        status: query.status,
        limit: 50,
      }),
  });
}
