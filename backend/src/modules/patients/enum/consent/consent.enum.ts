export const CONSENT_TYPES = [
  'DATA_PROCESSING',
  'WHATSAPP_MARKETING',
  'IMAGE_USE',
  'TERMS',
] as const;

export type ConsentType = (typeof CONSENT_TYPES)[number];

export const CONSENT_CHANNELS = ['IN_PERSON', 'LINK', 'WHATSAPP', 'PUBLIC_BOOKING'] as const;

export type ConsentChannel = (typeof CONSENT_CHANNELS)[number];
