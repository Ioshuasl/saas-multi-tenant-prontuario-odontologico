import { z } from 'zod';
import { ROLES } from '@/packages/admin/enum/RoleEnum';

export const InvitationCreateSchema = z.object({
  email: z.string().email('E-mail inválido').max(255),
  role: z.enum(ROLES as [string, ...string[]]),
});

export type InvitationCreateFormValues = z.infer<typeof InvitationCreateSchema>;
