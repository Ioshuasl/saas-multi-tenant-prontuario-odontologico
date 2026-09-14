export const DataSubjectRequestType = {
  ACCESS: 'ACCESS',
  CORRECTION: 'CORRECTION',
  DELETION: 'DELETION',
  PORTABILITY: 'PORTABILITY',
  REVOKE_CONSENT: 'REVOKE_CONSENT',
} as const;

export type DataSubjectRequestType =
  (typeof DataSubjectRequestType)[keyof typeof DataSubjectRequestType];

export const DATA_SUBJECT_REQUEST_TYPES = Object.values(DataSubjectRequestType);

export const DATA_SUBJECT_REQUEST_TYPE_LABELS: Record<DataSubjectRequestType, string> = {
  ACCESS: 'Acesso',
  CORRECTION: 'Correção',
  DELETION: 'Eliminação',
  PORTABILITY: 'Portabilidade',
  REVOKE_CONSENT: 'Revogar consentimento',
};

export const DATA_SUBJECT_REQUEST_PACKAGE_TYPES: DataSubjectRequestType[] = [
  DataSubjectRequestType.ACCESS,
  DataSubjectRequestType.PORTABILITY,
];
