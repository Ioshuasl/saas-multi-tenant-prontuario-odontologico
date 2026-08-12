'use client';

import { useMutation } from '@tanstack/react-query';
import { AuthLoginService } from '@/packages/public/services/Auth/AuthLoginService';
import { useAuth } from '@/shared/auth/AuthProvider';

export function useAuthLoginHook() {
  const { applySession, loadMe } = useAuth();

  return useMutation({
    mutationFn: AuthLoginService,
    onSuccess: async (session) => {
      applySession(session);
      await loadMe();
    },
  });
}
