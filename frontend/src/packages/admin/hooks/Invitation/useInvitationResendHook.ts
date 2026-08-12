'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminQueryKeys } from '@/packages/admin/helpers/AdminQueryKeys';
import { InvitationResendService } from '@/packages/admin/services/Invitation/InvitationResendService';

export function useInvitationResendHook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: InvitationResendService,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.invitations });
    },
  });
}
