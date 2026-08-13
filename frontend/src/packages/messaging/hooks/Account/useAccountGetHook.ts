'use client';

import { useQuery } from '@tanstack/react-query';
import { ApiClientError } from '@/shared/api/api-client';
import { messagingQueryKeys } from '@/packages/messaging/helpers/MessagingQueryKeys';
import { AccountGetService } from '@/packages/messaging/services/Account/AccountGetService';

export function useAccountGetHook() {
  return useQuery({
    queryKey: messagingQueryKeys.account,
    queryFn: async () => {
      try {
        return await AccountGetService();
      } catch (error) {
        if (error instanceof ApiClientError && error.status === 404) return null;
        throw error;
      }
    },
    retry: false,
  });
}
