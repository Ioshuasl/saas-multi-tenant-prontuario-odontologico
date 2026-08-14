import type { QuoteStatus } from '../../enum/quote/quote_status.enum.js';

export type QuoteItemDto = {
  id: string;
  procedureId: string;
  procedureName: string;
  procedureCode: string;
  toothCode: string | null;
  face: string | null;
  quantity: number;
  unitPriceCents: number;
  discountCents: number;
  totalCents: number;
  sortOrder: number;
  approved: boolean;
};

export type QuoteDto = {
  id: string;
  number: string;
  status: QuoteStatus;
  patientId: string;
  professionalId: string;
  unitId: string;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  validUntil: string | null;
  notes: string | null;
  sentAt: string | null;
  decidedAt: string | null;
  rejectReason: string | null;
  items: QuoteItemDto[];
  receivable: {
    id: string;
    totalCents: number;
    downPaymentCents: number;
    installments: Array<{ number: number; dueDate: string; amountCents: number }>;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type QuoteListItemDto = Omit<QuoteDto, 'items' | 'notes' | 'receivable'>;

export type QuoteListResult = {
  items: QuoteListItemDto[];
  nextCursor: string | null;
};
