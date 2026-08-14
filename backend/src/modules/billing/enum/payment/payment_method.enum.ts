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
