import { z } from 'zod';
import { ROLES } from '@/packages/admin/enum/RoleEnum';

export const MemberUpdateSchema = z.object({
  role: z.enum(ROLES as [string, ...string[]]),
  active: z.boolean(),
});

export type MemberUpdateFormValues = z.infer<typeof MemberUpdateSchema>;
