export const ATTACHMENT_CATEGORIES = [
  'XRAY',
  'PHOTO_INTRAORAL',
  'PHOTO_FACIAL',
  'DOCUMENT',
  'EXAM',
  'CONSENT_FORM',
  'OTHER',
] as const;

export type AttachmentCategory = (typeof ATTACHMENT_CATEGORIES)[number];

export const ATTACHMENT_CATEGORY_LABELS: Record<AttachmentCategory, string> = {
  XRAY: 'Radiografia',
  PHOTO_INTRAORAL: 'Foto intraoral',
  PHOTO_FACIAL: 'Foto facial',
  DOCUMENT: 'Documento',
  EXAM: 'Exame',
  CONSENT_FORM: 'Termo de consentimento',
  OTHER: 'Outro',
};

export const PHOTO_CATEGORIES = ['PHOTO_INTRAORAL', 'PHOTO_FACIAL'] as const;
