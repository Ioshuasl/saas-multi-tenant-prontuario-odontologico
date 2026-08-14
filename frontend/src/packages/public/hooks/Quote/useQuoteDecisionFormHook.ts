'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  PublicQuoteDecisionFormSchema,
  type PublicQuoteDecisionFormValues,
} from '@/packages/public/schemas/Quote/QuoteSchema';

function defaultFirstDueDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

export function useQuoteDecisionFormHook(approvedItemIds: string[] = []) {
  return useForm<PublicQuoteDecisionFormValues>({
    resolver: zodResolver(PublicQuoteDecisionFormSchema),
    defaultValues: {
      decision: 'APPROVED',
      approvedItemIds,
      reason: '',
      guardianCpf: '',
      installments: 6,
      firstDueDate: defaultFirstDueDate(),
      method: 'PIX',
      downPaymentReais: '0',
    },
  });
}
