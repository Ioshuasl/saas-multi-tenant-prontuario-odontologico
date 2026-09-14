'use client';

import { useQuery } from '@tanstack/react-query';
import { adminQueryKeys } from '@/packages/admin/helpers/AdminQueryKeys';
import { DashboardGetService } from '@/packages/admin/services/Report/DashboardGetService';
import type { DashboardQuery } from '@/packages/admin/types/Report/ReportTypes';

export function useDashboardGetHook(query: DashboardQuery = {}, enabled = true) {
  return useQuery({
    queryKey: adminQueryKeys.dashboard(query),
    queryFn: () => DashboardGetService(query),
    enabled,
  });
}
