'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CashSessionOpenFormSchema,
  type CashSessionOpenFormValues,
} from '@/packages/financeiro/schemas/CashSession/CashSessionOpenSchema';

export function useCashSessionOpenFormHook() {
  return useForm<CashSessionOpenFormValues>({
    resolver: zodResolver(CashSessionOpenFormSchema),
    defaultValues: { openingReais: '0,00' },
  });
}
