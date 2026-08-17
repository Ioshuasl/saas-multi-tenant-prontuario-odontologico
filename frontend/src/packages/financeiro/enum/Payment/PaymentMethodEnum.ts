export const PAYMENT_METHODS = [
  'CASH',
  'DEBIT_CARD',
  'CREDIT_CARD',
  'PIX',
  'BANK_TRANSFER',
  'CHECK',
  'INSURANCE',
  'PATIENT_CREDIT',
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Dinheiro',
  DEBIT_CARD: 'Débito',
  CREDIT_CARD: 'Crédito',
  PIX: 'Pix',
  BANK_TRANSFER: 'Transferência',
  CHECK: 'Cheque',
  INSURANCE: 'Convênio',
  PATIENT_CREDIT: 'Crédito do paciente',
};
