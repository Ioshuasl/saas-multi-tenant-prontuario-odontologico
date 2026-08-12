'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Role } from '@/packages/admin/enum/RoleEnum';
import {
  MemberUpdateSchema,
  type MemberUpdateFormValues,
} from '@/packages/admin/schemas/Member/MemberSchema';

export function useMemberFormHook(defaults?: Partial<MemberUpdateFormValues>) {
  return useForm<MemberUpdateFormValues>({
    resolver: zodResolver(MemberUpdateSchema),
    defaultValues: {
      role: defaults?.role ?? Role.RECEPTION,
      active: defaults?.active ?? true,
    },
  });
}
