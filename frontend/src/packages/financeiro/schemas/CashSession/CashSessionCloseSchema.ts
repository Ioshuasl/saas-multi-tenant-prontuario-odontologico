import { z } from 'zod';
import { PAYMENT_METHODS } from '@/packages/financeiro/enum/Payment/PaymentMethodEnum';
import { reaisInputToCents } from '@/packages/financeiro/helpers/FormatCents';
import type { CashSessionCloseInput } from '@/packages/financeiro/types/CashSession/CashSessionTypes';

const countedLineSchema = z.object({
  method: z.enum(PAYMENT_METHODS),
  countedReais: z.string().min(1),
});

export const CashSessionCloseFormSchema = z
  .object({
    countedByMethod: z.array(countedLineSchema).min(1),
    differenceReason: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    // reason validated in dialog against expected vs counted
    if (value.differenceReason && value.differenceReason.trim().length > 0 && value.differenceReason.trim().length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Justificativa com ao menos 10 caracteres.',
        path: ['differenceReason'],
      });
    }
  });

export type CashSessionCloseFormValues = z.infer<typeof CashSessionCloseFormSchema>;

export function toCashSessionClosePayload(
  values: CashSessionCloseFormValues,
): CashSessionCloseInput {
  return {
    countedByMethod: values.countedByMethod.map((line) => ({
      method: line.method,
      countedCents: reaisInputToCents(line.countedReais),
    })),
    differenceReason: values.differenceReason?.trim() || null,
  };
}

export function closeDifferenceCents(
  expectedByMethod: Array<{ method: string; expectedCents: number }>,
  countedByMethod: Array<{ method: string; countedCents: number }>,
): number {
  const expectedTotal = expectedByMethod.reduce((sum, row) => sum + row.expectedCents, 0);
  const countedTotal = countedByMethod.reduce((sum, row) => sum + row.countedCents, 0);
  return countedTotal - expectedTotal;
}
