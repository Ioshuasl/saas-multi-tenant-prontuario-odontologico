export const adminQueryKeys = {
  clinic: ['clinic'] as const,
  chairs: (unitId: string) => ['chairs', unitId] as const,
  businessHours: (unitId: string, professionalId?: string | null) =>
    ['business-hours', unitId, professionalId ?? null] as const,
  professionals: ['professionals'] as const,
  procedures: ['procedures'] as const,
  members: ['members'] as const,
  invitations: ['invitations'] as const,
  onboarding: ['onboarding'] as const,
  anamnesisForms: ['anamnesis-forms'] as const,
};
