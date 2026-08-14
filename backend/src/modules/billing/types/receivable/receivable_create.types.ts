export type CreateReceivableFromApprovedQuoteInput = {
  patientId: string;
  unitId: string;
  quoteId: string;
  treatmentPlanId: string;
  totalCents: bigint;
  installmentCount: number;
  firstDueDate: string;
  downPaymentCents: bigint;
  description?: string;
};

export type ReceivableCreated = {
  id: string;
  totalCents: bigint;
  downPaymentCents: bigint;
  installments: Array<{
    id: string;
    number: number;
    dueDate: string;
    amountCents: bigint;
  }>;
};

export type CreateProductionEntryInput = {
  unitId: string;
  professionalId: string;
  patientId: string;
  procedureId: string;
  amountCents: bigint;
  executedAt: Date;
  treatmentItemId?: string;
};
