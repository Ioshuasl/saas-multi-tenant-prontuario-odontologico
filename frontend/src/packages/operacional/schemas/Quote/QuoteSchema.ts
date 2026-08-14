import { z } from 'zod';
import { TOOTH_FACES } from '@/packages/operacional/enum/Quote/ToothFaceEnum';
import type { QuoteCreateInput, QuoteItemCreateInput } from '@/packages/operacional/types/Quote/QuoteTypes';

const optionalText = z.string().optional();

export const QuoteItemFormSchema = z.object({
  procedureId: z.string().uuid('Selecione o procedimento'),
  toothCode: optionalText,
  face: z.union([z.enum(TOOTH_FACES), z.literal('')]).optional(),
  quantity: z.coerce.number().int().min(1).max(99),
  discountCents: z.coerce.number().int().min(0),
});

export const QuoteCreateFormSchema = z.object({
  patientId: z.string().uuid('Selecione o paciente'),
  professionalId: z.string().uuid('Selecione o profissional'),
  validUntil: optionalText,
  notes: optionalText,
  discountCents: z.coerce.number().int().min(0),
  items: z.array(QuoteItemFormSchema).min(1, 'Inclua ao menos um item'),
});

export const QuoteUpdateFormSchema = z.object({
  validUntil: optionalText,
  notes: optionalText,
  discountCents: z.coerce.number().int().min(0),
});

export const QuoteItemAddFormSchema = QuoteItemFormSchema;

export type QuoteCreateFormValues = z.infer<typeof QuoteCreateFormSchema>;
export type QuoteUpdateFormValues = z.infer<typeof QuoteUpdateFormSchema>;
export type QuoteItemAddFormValues = z.infer<typeof QuoteItemAddFormSchema>;

function emptyToNull(value?: string | null): string | null | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function toQuoteCreatePayload(values: QuoteCreateFormValues): QuoteCreateInput {
  return {
    patientId: values.patientId,
    professionalId: values.professionalId,
    validUntil: emptyToNull(values.validUntil),
    notes: emptyToNull(values.notes),
    discountCents: values.discountCents,
    items: values.items.map(toQuoteItemPayload),
  };
}

export function toQuoteItemPayload(values: QuoteItemAddFormValues): QuoteItemCreateInput {
  return {
    procedureId: values.procedureId,
    toothCode: emptyToNull(values.toothCode),
    face: values.face ? values.face : null,
    quantity: values.quantity,
    discountCents: values.discountCents,
  };
}
