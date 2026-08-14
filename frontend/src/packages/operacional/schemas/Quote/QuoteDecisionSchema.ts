import { z } from 'zod';
import { reaisInputToCents } from '@/packages/operacional/helpers/FormatCents';
import type { QuoteDecisionInput } from '@/packages/operacional/types/Quote/QuoteTypes';

export const QuoteDecisionFormSchema = z
  .object({
    decision: z.enum(['APPROVED', 'REJECTED']),
    approvedItemIds: z.array(z.string().uuid()),
    reason: z.string().optional(),
    installments: z.coerce.number().int().min(1).max(60),
    firstDueDate: z.string(),
    method: z.string().optional(),
    downPaymentReais: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.decision === 'REJECTED') {
      const reason = value.reason?.trim() ?? '';
      if (reason.length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Informe o motivo com ao menos 10 caracteres.',
          path: ['reason'],
        });
      }
    }
    if (value.decision === 'APPROVED') {
      if (value.approvedItemIds.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Selecione ao menos um item.',
          path: ['approvedItemIds'],
        });
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value.firstDueDate)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Informe o primeiro vencimento.',
          path: ['firstDueDate'],
        });
      }
    }
  });

export type QuoteDecisionFormValues = z.infer<typeof QuoteDecisionFormSchema>;

export function toQuoteDecisionPayload(values: QuoteDecisionFormValues): QuoteDecisionInput {
  if (values.decision === 'REJECTED') {
    return {
      decision: 'REJECTED',
      reason: values.reason?.trim() ?? '',
    };
  }
  return {
    decision: 'APPROVED',
    approvedItemIds: values.approvedItemIds,
    payment: {
      installments: values.installments,
      firstDueDate: values.firstDueDate,
      method: values.method?.trim() || 'PIX',
      downPaymentCents: reaisInputToCents(values.downPaymentReais ?? ''),
    },
  };
}
