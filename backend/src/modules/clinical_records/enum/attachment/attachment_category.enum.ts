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
