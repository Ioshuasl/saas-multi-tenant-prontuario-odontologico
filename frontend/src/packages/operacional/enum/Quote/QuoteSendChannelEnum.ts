export const QUOTE_SEND_CHANNELS = ['WHATSAPP', 'EMAIL', 'COPY'] as const;

export type QuoteSendChannel = (typeof QUOTE_SEND_CHANNELS)[number];

export const QUOTE_SEND_CHANNEL_LABELS: Record<QuoteSendChannel, string> = {
  WHATSAPP: 'WhatsApp',
  EMAIL: 'E-mail',
  COPY: 'Copiar link',
};
