import { z } from 'zod';

export const supportAccessCreateSchema = z
  .object({
    tenantId: z.string().uuid(),
    reason: z.string().trim().min(1).max(4000),
    hours: z.coerce.number().int().optional(),
  })
  .strict();

export type SupportAccessCreateSchema = z.infer<typeof supportAccessCreateSchema>;

export const supportAccessIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type SupportAccessIdParamSchema = z.infer<typeof supportAccessIdParamSchema>;
