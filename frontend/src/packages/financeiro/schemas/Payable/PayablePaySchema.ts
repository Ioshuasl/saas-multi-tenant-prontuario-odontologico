import { z } from 'zod';
import { PAYMENT_METHODS } from '@/packages/financeiro/enum/Payment/PaymentMethodEnum';
import type { PayablePayInput } from '@/packages/financeiro/types/Payable/PayableTypes';

export const PayablePayFormSchema = z.object({
  method: z.enum(PAYMENT_METHODS),
});

export type PayablePayFormValues = z.infer<typeof PayablePayFormSchema>;

export function toPayablePayPayload(values: PayablePayFormValues): PayablePayInput {
  return { method: values.method };
}
