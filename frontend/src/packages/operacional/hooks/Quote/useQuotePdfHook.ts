'use client';

import { useMutation } from '@tanstack/react-query';
import { QuotePdfService } from '@/packages/operacional/services/Quote/QuotePdfService';

export function useQuotePdfHook() {
  return useMutation({
    mutationFn: (quoteId: string) => QuotePdfService(quoteId),
  });
}
