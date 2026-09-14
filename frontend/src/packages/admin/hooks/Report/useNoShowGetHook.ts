'use client';

import { useQuery } from '@tanstack/react-query';
import { adminQueryKeys } from '@/packages/admin/helpers/AdminQueryKeys';
import { NoShowGetService } from '@/packages/admin/services/Report/NoShowGetService';
import type { ReportPeriodQuery } from '@/packages/admin/types/Report/ReportTypes';

export function useNoShowGetHook(query: ReportPeriodQuery, enabled = true) {
  return useQuery({
    queryKey: adminQueryKeys.noShows(query),
    queryFn: () => NoShowGetService(query),
    enabled,
  });
}
