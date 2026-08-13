'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { messagingQueryKeys } from '@/packages/messaging/helpers/MessagingQueryKeys';
import { AccountDeleteService } from '@/packages/messaging/services/Account/AccountDeleteService';

export function useAccountDeleteHook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: AccountDeleteService,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: messagingQueryKeys.account });
      await queryClient.invalidateQueries({ queryKey: messagingQueryKeys.usage });
      await queryClient.invalidateQueries({ queryKey: ['messaging-logs'] });
    },
  });
}
