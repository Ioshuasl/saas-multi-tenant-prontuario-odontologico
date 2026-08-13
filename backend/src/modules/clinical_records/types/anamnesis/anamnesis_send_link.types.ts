import type { SendLinkChannel } from '../../enum/anamnesis/send_link_channel.enum.js';

export type AnamnesisSendLinkResult = {
  expiresAt: string;
  sentVia: SendLinkChannel;
  publicUrl?: string;
};
