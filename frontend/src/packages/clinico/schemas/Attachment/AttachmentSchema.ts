import { z } from 'zod';

export const AttachmentDeleteSchema = z.object({
  reason: z.string().trim().min(10, 'Motivo mínimo 10 caracteres').max(2000),
});

export type AttachmentDeleteFormValues = z.infer<typeof AttachmentDeleteSchema>;
