'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AuthResetPasswordSchema,
  type AuthResetPasswordFormValues,
} from '@/packages/public/schemas/Auth/AuthSchema';

export function useAuthResetPasswordFormHook(token: string) {
  return useForm<AuthResetPasswordFormValues>({
    resolver: zodResolver(AuthResetPasswordSchema),
    defaultValues: { token, password: '' },
  });
}
