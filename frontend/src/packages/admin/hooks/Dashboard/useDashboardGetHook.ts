'use client';

import { useQuery } from '@tanstack/react-query';
import { adminQueryKeys } from '@/packages/admin/helpers/AdminQueryKeys';
import { DashboardGetService } from '@/packages/admin/services/Dashboard/DashboardGetService';
import type { DashboardQuery } from '@/packages/admin/types/Dashboard/DashboardTypes';

export function useDashboardGetHook(query: DashboardQuery = {}, enabled = true) {
  return useQuery({
    queryKey: adminQueryKeys.dashboard(query.date),
    queryFn: () => DashboardGetService(query),
    enabled,
  });
}
