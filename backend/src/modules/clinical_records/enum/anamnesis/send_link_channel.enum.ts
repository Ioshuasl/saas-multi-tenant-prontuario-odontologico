export const SEND_LINK_CHANNELS = ['WHATSAPP', 'EMAIL', 'COPY'] as const;

export type SendLinkChannel = (typeof SEND_LINK_CHANNELS)[number];
