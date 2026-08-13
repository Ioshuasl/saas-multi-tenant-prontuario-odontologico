'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { WaitlistDeleteService } from '@/packages/operacional/services/Waitlist/WaitlistDeleteService';

export function useWaitlistDeleteHook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: WaitlistDeleteService,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['waitlist'] });
    },
  });
}
