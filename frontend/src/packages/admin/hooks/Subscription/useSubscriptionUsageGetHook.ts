'use client';

import { useQuery } from '@tanstack/react-query';
import { adminQueryKeys } from '@/packages/admin/helpers/AdminQueryKeys';
import { SubscriptionUsageGetService } from '@/packages/admin/services/Subscription/SubscriptionUsageGetService';

export function useSubscriptionUsageGetHook(enabled = true) {
  return useQuery({
    queryKey: adminQueryKeys.subscriptionUsage,
    queryFn: () => SubscriptionUsageGetService(),
    enabled,
  });
}
