'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  QuoteSendSchema,
  type QuoteSendFormValues,
} from '@/packages/operacional/schemas/Quote/QuoteSendSchema';

export function useQuoteSendFormHook() {
  return useForm<QuoteSendFormValues>({
    resolver: zodResolver(QuoteSendSchema),
    defaultValues: { channel: 'COPY' },
  });
}
