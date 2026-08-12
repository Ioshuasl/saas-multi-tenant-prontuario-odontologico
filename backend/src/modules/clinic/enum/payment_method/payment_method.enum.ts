export const PaymentMethod = {
  CASH: 'CASH',
  PIX: 'PIX',
  CREDIT_CARD: 'CREDIT_CARD',
  DEBIT_CARD: 'DEBIT_CARD',
  BOLETO: 'BOLETO',
} as const;

export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PAYMENT_METHODS = Object.values(PaymentMethod);
