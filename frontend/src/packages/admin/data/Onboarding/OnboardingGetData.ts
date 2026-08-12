import { apiClient } from '@/shared/api/api-client';
import type { OnboardingStatus } from '@/packages/admin/types/Onboarding/OnboardingTypes';

export async function OnboardingGetData(): Promise<OnboardingStatus> {
  return apiClient.request<OnboardingStatus>('/clinic/onboarding');
}
