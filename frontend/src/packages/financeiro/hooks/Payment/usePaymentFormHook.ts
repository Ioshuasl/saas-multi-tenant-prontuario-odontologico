'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  PaymentFormSchema,
  type PaymentFormValues,
} from '@/packages/financeiro/schemas/Payment/PaymentSchema';

export function usePaymentFormHook(defaultValues: PaymentFormValues) {
  return useForm<PaymentFormValues>({
    resolver: zodResolver(PaymentFormSchema),
    defaultValues,
  });
}
