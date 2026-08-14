import type { QuoteSendChannel } from '../../enum/quote/send_channel.enum.js';
import type { QuoteDto } from './quote_crud.types.js';

export type QuoteSendResult = {
  quote: QuoteDto;
  sentVia: QuoteSendChannel;
  expiresAt: string;
  publicUrl?: string;
};

export type QuotePdfResult = {
  url: string;
  expiresIn: number;
};
