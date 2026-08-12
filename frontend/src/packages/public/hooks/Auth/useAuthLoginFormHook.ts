'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AuthLoginSchema,
  type AuthLoginFormValues,
} from '@/packages/public/schemas/Auth/AuthSchema';

export function useAuthLoginFormHook() {
  return useForm<AuthLoginFormValues>({
    resolver: zodResolver(AuthLoginSchema),
    defaultValues: { email: '', password: '' },
  });
}
