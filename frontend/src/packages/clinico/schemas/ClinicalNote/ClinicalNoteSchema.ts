import { z } from 'zod';

export const ClinicalNoteCreateSchema = z.object({
  content: z.string().trim().min(10, 'Mínimo 10 caracteres').max(20000),
});

export type ClinicalNoteCreateFormValues = z.infer<typeof ClinicalNoteCreateSchema>;

export const ClinicalNoteAmendSchema = z.object({
  content: z.string().trim().min(10, 'Mínimo 10 caracteres').max(20000),
  reason: z.string().trim().min(10, 'Motivo mínimo 10 caracteres').max(2000),
});

export type ClinicalNoteAmendFormValues = z.infer<typeof ClinicalNoteAmendSchema>;
