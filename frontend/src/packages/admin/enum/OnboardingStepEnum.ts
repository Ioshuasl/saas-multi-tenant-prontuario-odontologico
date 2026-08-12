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

export const REQUIRED_ONBOARDING_STEPS: readonly OnboardingStep[] = [
  OnboardingStep.CLINIC,
  OnboardingStep.HOURS,
  OnboardingStep.PROFESSIONALS,
];

export const ONBOARDING_STEP_LABELS: Record<OnboardingStep, string> = {
  clinic: 'Clínica',
  hours: 'Horários',
  professionals: 'Profissionais',
  procedures: 'Procedimentos',
  team: 'Equipe',
  whatsapp: 'WhatsApp',
  firstAppointment: 'Primeiro agendamento',
};

export const ONBOARDING_STEP_HREFS: Record<OnboardingStep, string> = {
  clinic: '/app/configuracoes/clinica',
  hours: '/app/configuracoes/horarios',
  professionals: '/app/configuracoes/profissionais',
  procedures: '/app/configuracoes/procedimentos',
  team: '/app/configuracoes/membros',
  whatsapp: '/app/onboarding',
  firstAppointment: '/app/onboarding',
};
