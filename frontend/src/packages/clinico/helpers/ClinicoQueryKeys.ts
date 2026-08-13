export const clinicoQueryKeys = {
  appointment: (id: string) => ['clinico-appointment', id] as const,
  patient: (id: string) => ['clinico-patient', id] as const,
  medicalRecord: (patientId: string) => ['clinico-record', patientId] as const,
  odontogramRoot: (patientId: string) => ['clinico-odontogram', patientId] as const,
  odontogram: (patientId: string, dentition: string) =>
    ['clinico-odontogram', patientId, dentition] as const,
  notes: (patientId: string) => ['clinico-notes', patientId] as const,
  attachments: (patientId: string) => ['clinico-attachments', patientId] as const,
};
