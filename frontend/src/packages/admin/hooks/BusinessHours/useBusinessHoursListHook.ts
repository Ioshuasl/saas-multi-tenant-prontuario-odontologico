'use client';

import { useQuery } from '@tanstack/react-query';
import { adminQueryKeys } from '@/packages/admin/helpers/AdminQueryKeys';
import { BusinessHoursListService } from '@/packages/admin/services/BusinessHours/BusinessHoursListService';

export function useBusinessHoursListHook(
  unitId: string | undefined,
  professionalId?: string | null,
) {
  return useQuery({
    queryKey: adminQueryKeys.businessHours(unitId ?? '', professionalId),
    queryFn: () => BusinessHoursListService(unitId!, professionalId),
    enabled: Boolean(unitId),
  });
}
