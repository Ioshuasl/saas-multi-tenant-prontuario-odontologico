'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { messagingQueryKeys } from '@/packages/messaging/helpers/MessagingQueryKeys';
import { AccountCreateService } from '@/packages/messaging/services/Account/AccountCreateService';

export function useAccountCreateHook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: AccountCreateService,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: messagingQueryKeys.account });
      await queryClient.invalidateQueries({ queryKey: messagingQueryKeys.qr });
    },
  });
}
