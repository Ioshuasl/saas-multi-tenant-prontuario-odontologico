'use client';

import { useQuery } from '@tanstack/react-query';
import { operacionalQueryKeys } from '@/packages/operacional/helpers/OperacionalQueryKeys';
import { WaitlistListService } from '@/packages/operacional/services/Waitlist/WaitlistListService';

export function useWaitlistListHook(professionalId?: string) {
  return useQuery({
    queryKey: operacionalQueryKeys.waitlist(professionalId),
    queryFn: () =>
      WaitlistListService(professionalId ? { professionalId } : {}),
  });
}
