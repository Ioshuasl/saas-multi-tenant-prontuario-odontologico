'use client';

import { useMutation } from '@tanstack/react-query';
import { WaitlistAcceptCreateService } from '@/packages/public/services/WaitlistAccept/WaitlistAcceptCreateService';

export function useWaitlistAcceptCreateHook() {
  return useMutation({
    mutationFn: WaitlistAcceptCreateService,
  });
}
