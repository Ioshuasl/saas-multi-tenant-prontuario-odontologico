export const publicQueryKeys = {
  clinic: (slug: string) => ['public-clinic', slug] as const,
  availability: (slug: string, procedureId: string, professionalId: string, from: string, to: string) =>
    ['public-availability', slug, procedureId, professionalId, from, to] as const,
  confirm: (token: string) => ['public-booking-confirm', token] as const,
};
