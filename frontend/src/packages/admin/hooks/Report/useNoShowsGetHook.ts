'use client';

import { useQuery } from '@tanstack/react-query';
import { adminQueryKeys } from '@/packages/admin/helpers/AdminQueryKeys';
import { NoShowsGetService } from '@/packages/admin/services/Report/NoShowsGetService';
import type { NoShowsQuery } from '@/packages/admin/types/Report/ReportTypes';

export function useNoShowsGetHook(query: NoShowsQuery, enabled = true) {
  return useQuery({
    queryKey: adminQueryKeys.noShows(query),
    queryFn: () => NoShowsGetService(query),
    enabled: enabled && Boolean(query.from && query.to),
  });
}
