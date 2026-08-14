'use client';

import { useMutation } from '@tanstack/react-query';
import { QuoteDecisionCreateService } from '@/packages/public/services/Quote/QuoteDecisionCreateService';

export function useQuoteDecisionCreateHook() {
  return useMutation({
    mutationFn: QuoteDecisionCreateService,
  });
}
