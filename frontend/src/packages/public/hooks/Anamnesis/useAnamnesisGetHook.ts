'use client';

import { useQuery } from '@tanstack/react-query';
import { publicQueryKeys } from '@/packages/public/helpers/PublicQueryKeys';
import { AnamnesisGetService } from '@/packages/public/services/Anamnesis/AnamnesisGetService';

export function useAnamnesisGetHook(token: string) {
  return useQuery({
    queryKey: publicQueryKeys.anamnesis(token),
    queryFn: () => AnamnesisGetService(token),
    enabled: Boolean(token),
    retry: false,
  });
}
