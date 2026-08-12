'use client';

import { useMutation } from '@tanstack/react-query';
import { AuthForgotPasswordService } from '@/packages/public/services/Auth/AuthForgotPasswordService';

export function useAuthForgotPasswordHook() {
  return useMutation({
    mutationFn: AuthForgotPasswordService,
  });
}
