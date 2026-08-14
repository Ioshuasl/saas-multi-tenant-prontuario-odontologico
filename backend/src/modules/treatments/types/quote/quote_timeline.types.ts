import type { QuoteStatus } from '../../enum/quote/quote_status.enum.js';

export type QuoteTimelineItem = {
  id: string;
  number: string;
  status: QuoteStatus;
  totalCents: number;
  decidedAt: string | null;
  createdAt: string;
};
