import { z } from 'zod';
import { QUOTE_SEND_CHANNELS } from '../enum/quote/send_channel.enum.js';
import { QUOTE_STATUSES } from '../enum/quote/quote_status.enum.js';
import { TOOTH_FACES } from '../enum/quote/tooth_face.enum.js';

export const quoteItemInputSchema = z
  .object({
    procedureId: z.string().uuid(),
    toothCode: z.string().min(2).max(2).optional().nullable(),
    face: z.enum(TOOTH_FACES).optional().nullable(),
    quantity: z.number().int().min(1).max(99).optional(),
    discountCents: z.number().int().min(0).optional(),
  })
  .strict();

export type QuoteItemInputSchema = z.infer<typeof quoteItemInputSchema>;

export const quoteCreateSchema = z
  .object({
    patientId: z.string().uuid(),
    professionalId: z.string().uuid(),
    unitId: z.string().uuid().optional(),
    validUntil: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .nullable(),
    notes: z.string().max(4000).optional().nullable(),
    discountCents: z.number().int().min(0).optional(),
    items: z.array(quoteItemInputSchema).min(1).max(100),
  })
  .strict();

export type QuoteCreateSchema = z.infer<typeof quoteCreateSchema>;

export const quoteUpdateSchema = z
  .object({
    validUntil: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .nullable(),
    notes: z.string().max(4000).optional().nullable(),
    discountCents: z.number().int().min(0).optional(),
  })
  .strict();

export type QuoteUpdateSchema = z.infer<typeof quoteUpdateSchema>;

export const quoteItemCreateSchema = quoteItemInputSchema;

export type QuoteItemCreateSchema = z.infer<typeof quoteItemCreateSchema>;

export const quoteIdParamSchema = z.object({ id: z.string().uuid() });

export const quoteItemIdParamSchema = z.object({
  id: z.string().uuid(),
  itemId: z.string().uuid(),
});

export const quoteListQuerySchema = z.object({
  patientId: z.string().uuid().optional(),
  status: z.enum(QUOTE_STATUSES).optional(),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type QuoteListQuerySchema = z.infer<typeof quoteListQuerySchema>;

export const quoteSendSchema = z
  .object({
    channel: z.enum(QUOTE_SEND_CHANNELS),
  })
  .strict();

export type QuoteSendSchema = z.infer<typeof quoteSendSchema>;

export const quoteDecisionSchema = z
  .object({
    decision: z.enum(['APPROVED', 'REJECTED']),
    approvedItemIds: z.array(z.string().uuid()).max(100).optional(),
    reason: z.string().max(2000).optional().nullable(),
    guardianCpf: z.string().max(14).optional(),
    payment: z
      .object({
        installments: z.number().int().min(1).max(60),
        firstDueDate: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/),
        method: z.string().max(40).optional(),
        downPaymentCents: z.number().int().min(0).optional(),
      })
      .strict()
      .optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.decision === 'REJECTED') {
      const reason = value.reason?.trim() ?? '';
      if (reason.length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Motivo da rejeição deve ter ao menos 10 caracteres.',
          path: ['reason'],
        });
      }
    }
    if (value.decision === 'APPROVED' && !value.payment) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe as condições de pagamento.',
        path: ['payment'],
      });
    }
  });

export type QuoteDecisionSchema = z.infer<typeof quoteDecisionSchema>;

export const publicQuoteTokenParamSchema = z.object({
  token: z.string().min(8).max(200),
});
