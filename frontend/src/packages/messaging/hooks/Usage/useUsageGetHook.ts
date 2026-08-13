'use client';

import { useQuery } from '@tanstack/react-query';
import { messagingQueryKeys } from '@/packages/messaging/helpers/MessagingQueryKeys';
import { UsageGetService } from '@/packages/messaging/services/Usage/UsageGetService';

export function useUsageGetHook(enabled = true) {
  return useQuery({
    queryKey: messagingQueryKeys.usage,
    queryFn: UsageGetService,
    enabled,
  });
}
