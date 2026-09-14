export const SUPPORT_ACCESS_SCOPE = 'clinical.read' as const;

export type SupportAccessScope = typeof SUPPORT_ACCESS_SCOPE;

export const SUPPORT_GRANT_PERMISSIONS = [
  'patients.read',
  'clinical_records.read',
  'agenda.read',
] as const;
