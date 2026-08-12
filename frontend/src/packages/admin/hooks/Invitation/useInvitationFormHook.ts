'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Role } from '@/packages/admin/enum/RoleEnum';
import {
  InvitationCreateSchema,
  type InvitationCreateFormValues,
} from '@/packages/admin/schemas/Invitation/InvitationSchema';

export function useInvitationFormHook() {
  return useForm<InvitationCreateFormValues>({
    resolver: zodResolver(InvitationCreateSchema),
    defaultValues: { email: '', role: Role.RECEPTION },
  });
}
