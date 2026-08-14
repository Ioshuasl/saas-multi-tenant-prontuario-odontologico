import { z } from 'zod';
import { TOOTH_FACES } from '../enum/tooth_state/tooth_face.enum.js';

const procedureSchema = z
  .object({
    procedureId: z.string().uuid(),
    toothCode: z.string().regex(/^\d{2}$/).optional().nullable(),
    tooth: z.string().regex(/^\d{2}$/).optional().nullable(),
    face: z.enum(TOOTH_FACES).optional().nullable(),
  })
  .strict()
  .transform((p) => ({
    procedureId: p.procedureId,
    toothCode: p.toothCode ?? p.tooth ?? null,
    face: p.face ?? null,
  }));

export const clinicalNoteListQuerySchema = z
  .object({
    cursor: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  })
  .strict();

export type ClinicalNoteListQuerySchema = z.infer<typeof clinicalNoteListQuerySchema>;

export const clinicalNoteCreateSchema = z
  .object({
    content: z.string().min(1).max(20000),
    appointmentId: z.string().uuid().optional().nullable(),
    procedures: z.array(procedureSchema).max(50).optional(),
    treatmentItemIds: z.array(z.string().uuid()).max(100).optional(),
  })
  .strict();

export type ClinicalNoteCreateSchema = z.infer<typeof clinicalNoteCreateSchema>;

export const clinicalNoteAmendSchema = z
  .object({
    content: z.string().min(1).max(20000),
    reason: z.string().min(1).max(2000),
  })
  .strict();

export type ClinicalNoteAmendSchema = z.infer<typeof clinicalNoteAmendSchema>;

export const clinicalNoteIdParamSchema = z
  .object({
    patientId: z.string().uuid(),
    id: z.string().uuid(),
  })
  .strict();

export type ClinicalNoteIdParamSchema = z.infer<typeof clinicalNoteIdParamSchema>;
