export type PublicQuoteItem = {
  id: string;
  procedureName: string;
  toothCode: string | null;
  face: string | null;
  quantity: number;
  unitPriceCents: number;
  discountCents: number;
  totalCents: number;
};

export type PublicQuoteView = {
  clinicName: string;
  patientFirstName: string;
  quoteNumber: string;
  validUntil: string | null;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  items: PublicQuoteItem[];
  expiresAt: string;
  requiresGuardian: boolean;
};

export type PublicQuoteDecisionInput = {
  decision: 'APPROVED' | 'REJECTED';
  approvedItemIds?: string[];
  reason?: string | null;
  guardianCpf?: string;
  payment?: {
    installments: number;
    firstDueDate: string;
    method?: string;
    downPaymentCents?: number;
  };
};

export type PublicQuoteReceivable = {
  id: string;
  totalCents: number;
  downPaymentCents: number;
  installments: Array<{ number: number; dueDate: string; amountCents: number }>;
};

export type PublicQuoteDecisionResult = {
  quoteId: string;
  status: string;
  treatmentPlanId: string | null;
  treatmentItems: number;
  receivable: PublicQuoteReceivable | null;
};
