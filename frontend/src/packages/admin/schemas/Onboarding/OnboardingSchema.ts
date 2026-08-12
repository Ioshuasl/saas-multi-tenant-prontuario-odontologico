import { z } from 'zod';
import { ONBOARDING_STEPS } from '@/packages/admin/enum/OnboardingStepEnum';

export const OnboardingSkipSchema = z.object({
  skipStep: z.enum(ONBOARDING_STEPS as [string, ...string[]]),
});

export type OnboardingSkipFormValues = z.infer<typeof OnboardingSkipSchema>;
