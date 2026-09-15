'use client';

import { useQuery } from '@tanstack/react-query';
import { adminQueryKeys } from '@/packages/admin/helpers/AdminQueryKeys';
import { ChairListService } from '@/packages/admin/services/Chair/ChairListService';

export function useChairListHook(
  unitId: string | undefined,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: adminQueryKeys.chairs(unitId ?? ''),
    queryFn: () => ChairListService(unitId!),
    enabled: Boolean(unitId) && (options?.enabled ?? true),
  });
}
