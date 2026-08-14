import { z } from 'zod';
import { reaisInputToCents } from '@/packages/public/helpers/FormatCents';
import type { PublicQuoteDecisionInput } from '@/packages/public/types/Quote/QuoteTypes';

export const PublicQuoteDecisionFormSchema = z
  .object({
    decision: z.enum(['APPROVED', 'REJECTED']),
    approvedItemIds: z.array(z.string().uuid()),
    reason: z.string().optional(),
    guardianCpf: z.string().optional(),
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

export type PublicQuoteDecisionFormValues = z.infer<typeof PublicQuoteDecisionFormSchema>;

export function toPublicQuoteDecisionPayload(
  values: PublicQuoteDecisionFormValues,
): PublicQuoteDecisionInput {
  if (values.decision === 'REJECTED') {
    return {
      decision: 'REJECTED',
      reason: values.reason?.trim() ?? '',
      guardianCpf: values.guardianCpf?.trim() || undefined,
    };
  }
  return {
    decision: 'APPROVED',
    approvedItemIds: values.approvedItemIds,
    guardianCpf: values.guardianCpf?.trim() || undefined,
    payment: {
      installments: values.installments,
      firstDueDate: values.firstDueDate,
      method: values.method?.trim() || 'PIX',
      downPaymentCents: reaisInputToCents(values.downPaymentReais ?? ''),
    },
  };
}
