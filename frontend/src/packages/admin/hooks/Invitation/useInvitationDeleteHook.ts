'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminQueryKeys } from '@/packages/admin/helpers/AdminQueryKeys';
import { InvitationDeleteService } from '@/packages/admin/services/Invitation/InvitationDeleteService';

export function useInvitationDeleteHook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: InvitationDeleteService,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.invitations });
    },
  });
}
