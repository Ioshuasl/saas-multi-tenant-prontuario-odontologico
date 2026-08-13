import { z } from 'zod';
import { SEND_LINK_CHANNELS } from '@/packages/operacional/enum/Anamnesis/SendLinkChannelEnum';

export const AnamnesisSendLinkSchema = z.object({
  channel: z.enum(SEND_LINK_CHANNELS),
});

export type AnamnesisSendLinkFormValues = z.infer<typeof AnamnesisSendLinkSchema>;
