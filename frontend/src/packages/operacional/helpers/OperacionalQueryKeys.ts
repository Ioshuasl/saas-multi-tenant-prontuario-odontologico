export const operacionalQueryKeys = {
  patients: (search?: string) => ['patients', search ?? ''] as const,
  patient: (id: string) => ['patient', id] as const,
  patientTimeline: (id: string) => ['patient-timeline', id] as const,
  patientConsents: (id: string) => ['patient-consents', id] as const,
  appointments: (professionalId: string, from: string, to: string) =>
    ['appointments', professionalId, from, to] as const,
  agendaProfessionals: ['agenda-professionals'] as const,
};
