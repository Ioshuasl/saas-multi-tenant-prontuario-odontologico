import { z } from 'zod';

export const ProfessionalCreateSchema = z.object({
  membershipId: z.string().uuid('Selecione um membro'),
  croNumber: z.string().max(20).optional().nullable(),
  croState: z.string().max(2).optional().nullable(),
  specialtiesText: z.string().optional(),
  color: z.string().max(20).optional().nullable(),
});

export type ProfessionalCreateFormValues = z.infer<typeof ProfessionalCreateSchema>;

export const ProfessionalUpdateSchema = z.object({
  croNumber: z.string().max(20).optional().nullable(),
  croState: z.string().max(2).optional().nullable(),
  specialtiesText: z.string().optional(),
  color: z.string().max(20).optional().nullable(),
  active: z.boolean(),
});

export type ProfessionalUpdateFormValues = z.infer<typeof ProfessionalUpdateSchema>;

export function specialtiesFromText(text: string | undefined): string[] {
  if (!text?.trim()) return [];
  return text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 10);
}
