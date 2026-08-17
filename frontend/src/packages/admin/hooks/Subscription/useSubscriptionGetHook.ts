'use client';

import { useQuery } from '@tanstack/react-query';
import { adminQueryKeys } from '@/packages/admin/helpers/AdminQueryKeys';
import { SubscriptionGetService } from '@/packages/admin/services/Subscription/SubscriptionGetService';

export function useSubscriptionGetHook(enabled = true) {
  return useQuery({
    queryKey: adminQueryKeys.subscription,
    queryFn: SubscriptionGetService,
    enabled,
  });
}
