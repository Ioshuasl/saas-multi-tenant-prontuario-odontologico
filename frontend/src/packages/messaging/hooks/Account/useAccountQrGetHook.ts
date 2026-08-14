'use client';

import { useQuery } from '@tanstack/react-query';
import { messagingQueryKeys } from '@/packages/messaging/helpers/MessagingQueryKeys';
import { AccountQrGetService } from '@/packages/messaging/services/Account/AccountQrGetService';

export function useAccountQrGetHook(enabled: boolean) {
  return useQuery({
    queryKey: messagingQueryKeys.qr,
    queryFn: AccountQrGetService,
    enabled,
    refetchInterval: enabled ? 2_000 : false,
  });
}
