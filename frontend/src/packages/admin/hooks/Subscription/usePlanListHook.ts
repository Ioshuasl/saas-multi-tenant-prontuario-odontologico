'use client';

import { useQuery } from '@tanstack/react-query';
import { adminQueryKeys } from '@/packages/admin/helpers/AdminQueryKeys';
import { PlanListService } from '@/packages/admin/services/Subscription/PlanListService';

export function usePlanListHook(enabled = true) {
  return useQuery({
    queryKey: adminQueryKeys.subscriptionPlans,
    queryFn: PlanListService,
    enabled,
  });
}
