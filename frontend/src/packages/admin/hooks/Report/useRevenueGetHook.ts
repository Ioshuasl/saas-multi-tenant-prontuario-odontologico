'use client';

import { useQuery } from '@tanstack/react-query';
import { adminQueryKeys } from '@/packages/admin/helpers/AdminQueryKeys';
import { RevenueGetService } from '@/packages/admin/services/Report/RevenueGetService';
import type { RevenueQuery } from '@/packages/admin/types/Report/ReportTypes';

export function useRevenueGetHook(query: RevenueQuery, enabled = true) {
  return useQuery({
    queryKey: adminQueryKeys.revenue(query),
    queryFn: () => RevenueGetService(query),
    enabled,
  });
}
