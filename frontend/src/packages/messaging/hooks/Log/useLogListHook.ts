'use client';

import { useQuery } from '@tanstack/react-query';
import { messagingQueryKeys } from '@/packages/messaging/helpers/MessagingQueryKeys';
import { LogListService } from '@/packages/messaging/services/Log/LogListService';

export function useLogListHook(enabled = true) {
  return useQuery({
    queryKey: messagingQueryKeys.logs(),
    queryFn: () => LogListService({ limit: 50 }),
    enabled,
  });
}
