'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { messagingQueryKeys } from '@/packages/messaging/helpers/MessagingQueryKeys';
import { AccountUpdateService } from '@/packages/messaging/services/Account/AccountUpdateService';

export function useAccountUpdateHook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: AccountUpdateService,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: messagingQueryKeys.account });
      await queryClient.invalidateQueries({ queryKey: messagingQueryKeys.usage });
    },
  });
}
