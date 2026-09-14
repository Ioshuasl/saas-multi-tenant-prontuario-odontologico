'use client';

import { useQuery } from '@tanstack/react-query';
import { adminQueryKeys } from '@/packages/admin/helpers/AdminQueryKeys';
import { UsageGetService } from '@/packages/admin/services/Subscription/UsageGetService';

export function useUsageGetHook(enabled = true) {
  return useQuery({
    queryKey: adminQueryKeys.subscriptionUsage,
    queryFn: UsageGetService,
    enabled,
  });
}
