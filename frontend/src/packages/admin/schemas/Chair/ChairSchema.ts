import { z } from 'zod';

export const ChairCreateSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(80),
  color: z.string().max(20).optional().nullable(),
});

export type ChairCreateFormValues = z.infer<typeof ChairCreateSchema>;

export const ChairUpdateSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(80),
  color: z.string().max(20).optional().nullable(),
  active: z.boolean(),
});

export type ChairUpdateFormValues = z.infer<typeof ChairUpdateSchema>;
