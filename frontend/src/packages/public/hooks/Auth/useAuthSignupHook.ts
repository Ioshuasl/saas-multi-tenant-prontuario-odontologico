'use client';

import { useMutation } from '@tanstack/react-query';
import { AuthSignupService } from '@/packages/public/services/Auth/AuthSignupService';
import { useAuth } from '@/shared/auth/AuthProvider';

export function useAuthSignupHook() {
  const { applySession, loadMe } = useAuth();

  return useMutation({
    mutationFn: AuthSignupService,
    onSuccess: async (session) => {
      applySession(session);
      await loadMe();
    },
  });
}
