export const QUOTE_SEND_CHANNELS = ['WHATSAPP', 'EMAIL', 'COPY'] as const;

export type QuoteSendChannel = (typeof QUOTE_SEND_CHANNELS)[number];
