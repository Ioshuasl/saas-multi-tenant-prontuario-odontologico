'use client';

import { useQuery } from '@tanstack/react-query';
import { adminQueryKeys } from '@/packages/admin/helpers/AdminQueryKeys';
import { OnboardingGetService } from '@/packages/admin/services/Onboarding/OnboardingGetService';

export function useOnboardingGetHook() {
  return useQuery({
    queryKey: adminQueryKeys.onboarding,
    queryFn: OnboardingGetService,
  });
}
