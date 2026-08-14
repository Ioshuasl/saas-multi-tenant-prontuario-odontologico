'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  QuoteDecisionFormSchema,
  type QuoteDecisionFormValues,
} from '@/packages/operacional/schemas/Quote/QuoteDecisionSchema';

function defaultFirstDueDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

export function useQuoteDecisionFormHook(approvedItemIds: string[] = []) {
  return useForm<QuoteDecisionFormValues>({
    resolver: zodResolver(QuoteDecisionFormSchema),
    defaultValues: {
      decision: 'APPROVED',
      approvedItemIds,
      reason: '',
      installments: 1,
      firstDueDate: defaultFirstDueDate(),
      method: 'PIX',
      downPaymentReais: '0',
    },
  });
}
