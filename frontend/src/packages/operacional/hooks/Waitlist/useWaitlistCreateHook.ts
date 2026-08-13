'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { WaitlistCreateService } from '@/packages/operacional/services/Waitlist/WaitlistCreateService';

export function useWaitlistCreateHook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: WaitlistCreateService,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['waitlist'] });
    },
  });
}
