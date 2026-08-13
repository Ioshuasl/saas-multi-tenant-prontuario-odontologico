'use client';

import { useQuery } from '@tanstack/react-query';
import { adminQueryKeys } from '@/packages/admin/helpers/AdminQueryKeys';
import { AnamnesisFormListService } from '@/packages/admin/services/AnamnesisForm/AnamnesisFormListService';

export function useAnamnesisFormListHook() {
  return useQuery({
    queryKey: adminQueryKeys.anamnesisForms,
    queryFn: AnamnesisFormListService,
  });
}
