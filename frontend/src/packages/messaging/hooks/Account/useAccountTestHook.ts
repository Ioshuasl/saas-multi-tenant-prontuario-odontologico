'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { messagingQueryKeys } from '@/packages/messaging/helpers/MessagingQueryKeys';
import { AccountTestService } from '@/packages/messaging/services/Account/AccountTestService';

export function useAccountTestHook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: AccountTestService,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: messagingQueryKeys.account });
      await queryClient.invalidateQueries({ queryKey: messagingQueryKeys.logs() });
      await queryClient.invalidateQueries({ queryKey: messagingQueryKeys.usage });
    },
    onError: async () => {
      await queryClient.invalidateQueries({ queryKey: messagingQueryKeys.account });
    },
  });
}
