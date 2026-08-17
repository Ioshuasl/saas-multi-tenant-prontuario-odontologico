'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { adminQueryKeys } from '@/packages/admin/helpers/AdminQueryKeys';
import { AuditLogListService } from '@/packages/admin/services/AuditLog/AuditLogListService';
import type { AuditLogListQuery } from '@/packages/admin/types/AuditLog/AuditLogTypes';

export function useAuditLogListHook(query: AuditLogListQuery, enabled = true) {
  return useInfiniteQuery({
    queryKey: adminQueryKeys.auditLogs(query),
    queryFn: ({ pageParam }) => AuditLogListService({ ...query, cursor: pageParam, limit: 50 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
  });
}
