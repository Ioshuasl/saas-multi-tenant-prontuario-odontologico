import { OnboardingUpdateData } from '@/packages/admin/data/Onboarding/OnboardingUpdateData';
import type { OnboardingSkipFormValues } from '@/packages/admin/schemas/Onboarding/OnboardingSchema';

export async function OnboardingUpdateService(onboardingSchema: OnboardingSkipFormValues) {
  return OnboardingUpdateData(onboardingSchema);
}
