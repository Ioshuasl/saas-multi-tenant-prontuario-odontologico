'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  PayableFormSchema,
  type PayableFormValues,
} from '@/packages/financeiro/schemas/Payable/PayableSchema';

export function usePayableFormHook(defaultValues?: Partial<PayableFormValues>) {
  return useForm<PayableFormValues>({
    resolver: zodResolver(PayableFormSchema),
    defaultValues: {
      categoryId: '',
      description: '',
      amountReais: '',
      dueDate: new Date().toISOString().slice(0, 10),
      supplier: '',
      monthly: false,
      until: '',
      ...defaultValues,
    },
  });
}
