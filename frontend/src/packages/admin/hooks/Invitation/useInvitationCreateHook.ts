'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminQueryKeys } from '@/packages/admin/helpers/AdminQueryKeys';
import { InvitationCreateService } from '@/packages/admin/services/Invitation/InvitationCreateService';

export function useInvitationCreateHook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: InvitationCreateService,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.invitations });
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.onboarding });
    },
  });
}
