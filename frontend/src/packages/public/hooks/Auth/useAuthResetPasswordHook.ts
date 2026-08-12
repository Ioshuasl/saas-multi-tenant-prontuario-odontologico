'use client';

import { useMutation } from '@tanstack/react-query';
import { AuthResetPasswordService } from '@/packages/public/services/Auth/AuthResetPasswordService';

export function useAuthResetPasswordHook() {
  return useMutation({
    mutationFn: AuthResetPasswordService,
  });
}
