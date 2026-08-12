import { apiClient } from '@/shared/api/api-client';
import type { OnboardingSkipFormValues } from '@/packages/admin/schemas/Onboarding/OnboardingSchema';
import type { OnboardingStatus } from '@/packages/admin/types/Onboarding/OnboardingTypes';

export async function OnboardingUpdateData(
  onboardingSchema: OnboardingSkipFormValues,
): Promise<OnboardingStatus> {
  return apiClient.request<OnboardingStatus>('/clinic/onboarding', {
    method: 'PATCH',
    body: JSON.stringify(onboardingSchema),
  });
}
