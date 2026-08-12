'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  InvitationAcceptSchema,
  type InvitationAcceptFormValues,
} from '@/packages/public/schemas/Invitation/InvitationSchema';

export function useInvitationAcceptFormHook(token: string) {
  return useForm<InvitationAcceptFormValues>({
    resolver: zodResolver(InvitationAcceptSchema),
    defaultValues: { token, name: '', password: '' },
  });
}
