import { z } from 'zod';

export const MessageCreateSchema = z.object({
  text: z.string().trim().min(1, 'Escreva uma mensagem.').max(4096),
});

export type MessageCreateFormValues = z.infer<typeof MessageCreateSchema>;
