export const WHATSAPP_ACCOUNT_STATUSES = [
  'PENDING',
  'CONNECTED',
  'ERROR',
  'DISCONNECTED',
] as const;

export type WhatsappAccountStatus = (typeof WHATSAPP_ACCOUNT_STATUSES)[number];
