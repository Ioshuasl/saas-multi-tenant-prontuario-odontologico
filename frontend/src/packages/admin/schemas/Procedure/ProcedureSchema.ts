import { z } from 'zod';

export const ProcedureCreateSchema = z.object({
  code: z.string().min(2, 'Código obrigatório').max(20),
  name: z.string().min(2, 'Nome obrigatório').max(200),
  specialty: z.string().max(80).optional().nullable(),
  defaultMinutes: z.coerce.number().int().min(5).max(480),
  priceCents: z.coerce.number().int().min(0),
  requiresTooth: z.boolean().optional(),
  requiresFace: z.boolean().optional(),
});

export type ProcedureCreateFormValues = z.infer<typeof ProcedureCreateSchema>;

export const ProcedureUpdateSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório').max(200),
  specialty: z.string().max(80).optional().nullable(),
  defaultMinutes: z.coerce.number().int().min(5).max(480),
  priceCents: z.coerce.number().int().min(0),
  requiresTooth: z.boolean(),
  requiresFace: z.boolean(),
  active: z.boolean(),
});

export type ProcedureUpdateFormValues = z.infer<typeof ProcedureUpdateSchema>;
