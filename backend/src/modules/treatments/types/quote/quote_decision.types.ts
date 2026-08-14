import type { QuoteStatus } from '../../enum/quote/quote_status.enum.js';
import type { QuoteDecidedBy } from '../../enum/quote/quote_decided_by.enum.js';

export type QuoteDecisionPayment = {
  installments: number;
  firstDueDate: string;
  method?: string;
  downPaymentCents?: number;
};

export type QuoteDecisionInput = {
  decision: 'APPROVED' | 'REJECTED';
  approvedItemIds?: string[];
  reason?: string | null;
  guardianCpf?: string;
  payment?: QuoteDecisionPayment;
};

export type QuoteDecideOptions = {
  decidedBy: QuoteDecidedBy;
  publicTokenId?: string | null;
  enforceGuardian?: boolean;
};

export type QuoteDecisionResult = {
  quoteId: string;
  status: QuoteStatus;
  treatmentPlanId: string | null;
  treatmentItems: number;
  receivable: {
    id: string;
    totalCents: number;
    downPaymentCents: number;
    installments: Array<{ number: number; dueDate: string; amountCents: number }>;
  } | null;
};

export type PublicQuoteView = {
  clinicName: string;
  patientFirstName: string;
  quoteNumber: string;
  validUntil: string | null;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  items: Array<{
    id: string;
    procedureName: string;
    toothCode: string | null;
    face: string | null;
    quantity: number;
    unitPriceCents: number;
    discountCents: number;
    totalCents: number;
  }>;
  expiresAt: string;
  requiresGuardian: boolean;
};
