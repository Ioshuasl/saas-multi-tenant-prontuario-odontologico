import { z } from 'zod';
import { PAYMENT_METHODS } from '@/packages/financeiro/enum/Payment/PaymentMethodEnum';
import { reaisInputToCents } from '@/packages/financeiro/helpers/FormatCents';
import type { PaymentCreateInput } from '@/packages/financeiro/types/Payment/PaymentTypes';

const splitSchema = z.object({
  method: z.enum(PAYMENT_METHODS),
  amountReais: z.string().min(1, 'Informe o valor.'),
  cardBrand: z.string().optional(),
  installmentsQty: z.coerce.number().int().min(1).max(24).optional().nullable(),
});

export const PaymentFormSchema = z
  .object({
    notes: z.string().max(2000).optional(),
    splits: z.array(splitSchema).min(1, 'Inclua ao menos uma forma de pagamento.'),
  })
  .superRefine((value, ctx) => {
    value.splits.forEach((split, index) => {
      const cents = reaisInputToCents(split.amountReais);
      if (cents <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Valor deve ser maior que zero.',
          path: ['splits', index, 'amountReais'],
        });
      }
    });
  });

export type PaymentFormValues = z.infer<typeof PaymentFormSchema>;

export function toPaymentCreatePayload(values: PaymentFormValues): PaymentCreateInput {
  const splits = values.splits.map((split) => ({
    method: split.method,
    amountCents: reaisInputToCents(split.amountReais),
    cardBrand: split.cardBrand?.trim() || null,
    installmentsQty: split.installmentsQty ?? null,
  }));
  return {
    amountCents: splits.reduce((sum, split) => sum + split.amountCents, 0),
    notes: values.notes?.trim() || null,
    splits,
  };
}
