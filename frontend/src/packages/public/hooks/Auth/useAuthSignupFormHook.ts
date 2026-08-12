'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AuthSignupSchema,
  type AuthSignupFormValues,
} from '@/packages/public/schemas/Auth/AuthSchema';

export function useAuthSignupFormHook() {
  return useForm<AuthSignupFormValues>({
    resolver: zodResolver(AuthSignupSchema),
    defaultValues: {
      email: '',
      password: '',
      clinicName: '',
      ownerName: '',
    },
  });
}
