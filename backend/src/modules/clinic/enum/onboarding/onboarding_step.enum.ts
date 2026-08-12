export const OnboardingStep = {
  CLINIC: 'clinic',
  HOURS: 'hours',
  PROFESSIONALS: 'professionals',
  PROCEDURES: 'procedures',
  TEAM: 'team',
  WHATSAPP: 'whatsapp',
  FIRST_APPOINTMENT: 'firstAppointment',
} as const;

export type OnboardingStep = (typeof OnboardingStep)[keyof typeof OnboardingStep];

export const ONBOARDING_STEPS = Object.values(OnboardingStep);

export const REQUIRED_ONBOARDING_STEPS = [
  OnboardingStep.CLINIC,
  OnboardingStep.HOURS,
  OnboardingStep.PROFESSIONALS,
] as const;
