export const adminQueryKeys = {
  clinic: ['clinic'] as const,
  chairs: (unitId: string) => ['chairs', unitId] as const,
  businessHours: (unitId: string) => ['business-hours', unitId] as const,
  professionals: ['professionals'] as const,
  procedures: ['procedures'] as const,
  members: ['members'] as const,
  invitations: ['invitations'] as const,
  onboarding: ['onboarding'] as const,
};
