import { z } from 'zod';
import { QUOTE_SEND_CHANNELS } from '@/packages/operacional/enum/Quote/QuoteSendChannelEnum';

export const QuoteSendSchema = z.object({
  channel: z.enum(QUOTE_SEND_CHANNELS),
});

export type QuoteSendFormValues = z.infer<typeof QuoteSendSchema>;
