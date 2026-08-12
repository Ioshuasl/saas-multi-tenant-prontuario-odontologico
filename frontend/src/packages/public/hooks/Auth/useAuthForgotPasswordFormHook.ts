'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AuthForgotPasswordSchema,
  type AuthForgotPasswordFormValues,
} from '@/packages/public/schemas/Auth/AuthSchema';

export function useAuthForgotPasswordFormHook() {
  return useForm<AuthForgotPasswordFormValues>({
    resolver: zodResolver(AuthForgotPasswordSchema),
    defaultValues: { email: '' },
  });
}
