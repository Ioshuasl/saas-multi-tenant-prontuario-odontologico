import { z } from 'zod';

export const InvitationAcceptSchema = z.object({
  token: z.string().min(1, 'Token inválido'),
  name: z.string().min(2, 'Nome obrigatório').max(120),
  password: z.string().min(10, 'A senha deve ter no mínimo 10 caracteres'),
});

export type InvitationAcceptFormValues = z.infer<typeof InvitationAcceptSchema>;
