'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { adminQueryKeys } from '@/packages/admin/helpers/AdminQueryKeys';
import { DataSubjectRequestListService } from '@/packages/admin/services/DataSubjectRequest/DataSubjectRequestListService';
import type { DataSubjectRequestListQuery } from '@/packages/admin/types/DataSubjectRequest/DataSubjectRequestTypes';

export function useDataSubjectRequestListHook(
  query: DataSubjectRequestListQuery = {},
  enabled = true,
) {
  return useInfiniteQuery({
    queryKey: adminQueryKeys.dataSubjectRequests(query),
    queryFn: ({ pageParam }) =>
      DataSubjectRequestListService({ ...query, cursor: pageParam, limit: 50 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
  });
}
