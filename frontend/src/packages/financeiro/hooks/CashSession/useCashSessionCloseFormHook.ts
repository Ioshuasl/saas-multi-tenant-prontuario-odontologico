'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CashSessionCloseFormSchema,
  type CashSessionCloseFormValues,
} from '@/packages/financeiro/schemas/CashSession/CashSessionCloseSchema';

export function useCashSessionCloseFormHook(defaultValues: CashSessionCloseFormValues) {
  return useForm<CashSessionCloseFormValues>({
    resolver: zodResolver(CashSessionCloseFormSchema),
    defaultValues,
  });
}
