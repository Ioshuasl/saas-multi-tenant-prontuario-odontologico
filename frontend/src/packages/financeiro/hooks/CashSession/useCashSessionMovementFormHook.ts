'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CashSessionMovementFormSchema,
  type CashSessionMovementFormValues,
} from '@/packages/financeiro/schemas/CashSession/CashSessionMovementSchema';

export function useCashSessionMovementFormHook() {
  return useForm<CashSessionMovementFormValues>({
    resolver: zodResolver(CashSessionMovementFormSchema),
    defaultValues: {
      kind: 'WITHDRAWAL',
      method: 'CASH',
      amountReais: '',
      reason: '',
    },
  });
}
