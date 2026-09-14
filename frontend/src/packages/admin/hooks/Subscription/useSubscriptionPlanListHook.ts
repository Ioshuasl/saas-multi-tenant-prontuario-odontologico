'use client';

import { useQuery } from '@tanstack/react-query';
import { adminQueryKeys } from '@/packages/admin/helpers/AdminQueryKeys';
import { SubscriptionPlanListService } from '@/packages/admin/services/Subscription/SubscriptionPlanListService';

export function useSubscriptionPlanListHook(enabled = true) {
  return useQuery({
    queryKey: adminQueryKeys.subscriptionPlans,
    queryFn: () => SubscriptionPlanListService(),
    enabled,
  });
}
