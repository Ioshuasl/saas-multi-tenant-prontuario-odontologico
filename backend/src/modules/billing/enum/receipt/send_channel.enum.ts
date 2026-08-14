export const RECEIPT_SEND_CHANNELS = ['WHATSAPP', 'EMAIL', 'COPY'] as const;

export type ReceiptSendChannel = (typeof RECEIPT_SEND_CHANNELS)[number];
