'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminQueryKeys } from '@/packages/admin/helpers/AdminQueryKeys';
import { OnboardingUpdateService } from '@/packages/admin/services/Onboarding/OnboardingUpdateService';

export function useOnboardingUpdateHook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: OnboardingUpdateService,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.onboarding });
    },
  });
}
