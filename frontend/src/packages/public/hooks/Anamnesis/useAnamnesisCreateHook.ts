'use client';

import { useMutation } from '@tanstack/react-query';
import { AnamnesisCreateService } from '@/packages/public/services/Anamnesis/AnamnesisCreateService';

export function useAnamnesisCreateHook() {
  return useMutation({
    mutationFn: AnamnesisCreateService,
  });
}
