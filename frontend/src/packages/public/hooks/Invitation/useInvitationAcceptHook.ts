'use client';

import { useMutation } from '@tanstack/react-query';
import { InvitationAcceptService } from '@/packages/public/services/Invitation/InvitationAcceptService';
import { useAuth } from '@/shared/auth/AuthProvider';

export function useInvitationAcceptHook() {
  const { applySession, loadMe } = useAuth();

  return useMutation({
    mutationFn: InvitationAcceptService,
    onSuccess: async (session) => {
      applySession(session);
      await loadMe();
    },
  });
}
