'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  PayablePayFormSchema,
  type PayablePayFormValues,
} from '@/packages/financeiro/schemas/Payable/PayablePaySchema';

export function usePayablePayFormHook() {
  return useForm<PayablePayFormValues>({
    resolver: zodResolver(PayablePayFormSchema),
    defaultValues: { method: 'PIX' },
  });
}
