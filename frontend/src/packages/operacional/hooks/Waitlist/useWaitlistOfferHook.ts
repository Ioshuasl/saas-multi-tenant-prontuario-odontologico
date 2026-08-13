'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { WaitlistOfferService } from '@/packages/operacional/services/Waitlist/WaitlistOfferService';

export function useWaitlistOfferHook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: WaitlistOfferService,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['waitlist'] });
      await queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}
