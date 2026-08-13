export const operacionalQueryKeys = {
  patients: (search?: string) => ['patients', search ?? ''] as const,
  patient: (id: string) => ['patient', id] as const,
  patientTimeline: (id: string) => ['patient-timeline', id] as const,
  patientConsents: (id: string) => ['patient-consents', id] as const,
  appointments: (resourceKey: string, from: string, to: string) =>
    ['appointments', resourceKey, from, to] as const,
  agendaProfessionals: ['agenda-professionals'] as const,
  agendaChairs: ['agenda-chairs'] as const,
  waitlist: (professionalId?: string) => ['waitlist', professionalId ?? ''] as const,
  procedures: ['procedures'] as const,
};
