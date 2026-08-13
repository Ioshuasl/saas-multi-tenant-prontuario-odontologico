export const WHATSAPP_ACCOUNT_STATUSES = [
  'PENDING',
  'CONNECTED',
  'ERROR',
  'DISCONNECTED',
] as const;

export type WhatsappAccountStatus = (typeof WHATSAPP_ACCOUNT_STATUSES)[number];

export const WHATSAPP_ACCOUNT_STATUS_LABELS: Record<WhatsappAccountStatus, string> = {
  PENDING: 'Aguardando teste',
  CONNECTED: 'Conectado',
  ERROR: 'Erro na conexão',
  DISCONNECTED: 'Desconectado',
};
