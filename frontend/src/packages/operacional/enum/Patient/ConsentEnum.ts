export const CONSENT_TYPES = [
  'DATA_PROCESSING',
  'WHATSAPP_MARKETING',
  'IMAGE_USE',
  'TERMS',
] as const;

export type ConsentType = (typeof CONSENT_TYPES)[number];

export const CONSENT_TYPE_LABELS: Record<ConsentType, string> = {
  DATA_PROCESSING: 'Tratamento de dados',
  WHATSAPP_MARKETING: 'Marketing WhatsApp',
  IMAGE_USE: 'Uso de imagem',
  TERMS: 'Termos de uso',
};

export const CONSENT_CHANNELS = ['IN_PERSON', 'LINK', 'WHATSAPP', 'PUBLIC_BOOKING'] as const;

export type ConsentChannel = (typeof CONSENT_CHANNELS)[number];

export const CONSENT_CHANNEL_LABELS: Record<ConsentChannel, string> = {
  IN_PERSON: 'Presencial',
  LINK: 'Link',
  WHATSAPP: 'WhatsApp',
  PUBLIC_BOOKING: 'Agendamento público',
};
