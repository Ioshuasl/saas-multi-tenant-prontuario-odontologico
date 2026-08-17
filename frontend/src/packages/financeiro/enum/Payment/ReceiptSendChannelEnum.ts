export const RECEIPT_SEND_CHANNELS = ['WHATSAPP', 'EMAIL', 'COPY'] as const;

export type ReceiptSendChannel = (typeof RECEIPT_SEND_CHANNELS)[number];

export const RECEIPT_SEND_CHANNEL_LABELS: Record<ReceiptSendChannel, string> = {
  WHATSAPP: 'WhatsApp',
  EMAIL: 'E-mail',
  COPY: 'Copiar texto',
};
