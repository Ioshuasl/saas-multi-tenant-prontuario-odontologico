export const SEND_LINK_CHANNELS = ['WHATSAPP', 'EMAIL', 'COPY'] as const;

export type SendLinkChannel = (typeof SEND_LINK_CHANNELS)[number];

export const SEND_LINK_CHANNEL_LABELS: Record<SendLinkChannel, string> = {
  WHATSAPP: 'WhatsApp',
  EMAIL: 'E-mail',
  COPY: 'Copiar link',
};
