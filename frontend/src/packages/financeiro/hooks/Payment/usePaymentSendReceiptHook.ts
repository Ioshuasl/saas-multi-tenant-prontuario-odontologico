'use client';

import { useMutation } from '@tanstack/react-query';
import { PaymentSendReceiptService } from '@/packages/financeiro/services/Payment/PaymentSendReceiptService';
import type { PaymentSendReceiptInput } from '@/packages/financeiro/types/Payment/PaymentTypes';

export function usePaymentSendReceiptHook(paymentId: string) {
  return useMutation({
    mutationFn: (paymentSendReceiptSchema: PaymentSendReceiptInput) =>
      PaymentSendReceiptService(paymentId, paymentSendReceiptSchema),
  });
}
