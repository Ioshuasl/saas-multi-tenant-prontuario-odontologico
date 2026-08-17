import { z } from 'zod';
import { CASH_MOVEMENT_KINDS } from '@/packages/financeiro/enum/CashSession/CashMovementKindEnum';
import { PAYMENT_METHODS } from '@/packages/financeiro/enum/Payment/PaymentMethodEnum';
import { reaisInputToCents } from '@/packages/financeiro/helpers/FormatCents';
import type { CashMovementCreateInput } from '@/packages/financeiro/types/CashSession/CashSessionTypes';

export const CashSessionMovementFormSchema = z.object({
  kind: z.enum(CASH_MOVEMENT_KINDS),
  method: z.enum(PAYMENT_METHODS),
  amountReais: z.string().min(1, 'Informe o valor.'),
  reason: z.string().trim().min(10, 'Motivo com ao menos 10 caracteres.'),
});

export type CashSessionMovementFormValues = z.infer<typeof CashSessionMovementFormSchema>;

export function toCashMovementCreatePayload(
  values: CashSessionMovementFormValues,
): CashMovementCreateInput {
  return {
    kind: values.kind,
    method: values.method,
    amountCents: reaisInputToCents(values.amountReais),
    reason: values.reason.trim(),
  };
}
