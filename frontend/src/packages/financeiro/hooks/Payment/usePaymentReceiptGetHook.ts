'use client';

import { useMutation } from '@tanstack/react-query';
import { ApiClientError } from '@/shared/api/api-client';
import { PaymentReceiptGetService } from '@/packages/financeiro/services/Payment/PaymentReceiptGetService';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function usePaymentReceiptGetHook() {
  return useMutation({
    mutationFn: async (paymentId: string) => {
      for (let attempt = 0; attempt < 8; attempt += 1) {
        try {
          return await PaymentReceiptGetService(paymentId);
        } catch (error) {
          if (error instanceof ApiClientError && error.code === 'PDF_PENDING' && attempt < 7) {
            await sleep(750);
            continue;
          }
          throw error;
        }
      }
      throw new ApiClientError('PDF_PENDING', 'PDF do recibo ainda não está disponível.', 409);
    },
  });
}
