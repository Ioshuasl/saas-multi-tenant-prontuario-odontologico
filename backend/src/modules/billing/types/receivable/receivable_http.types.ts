import type { InstallmentStatus } from '../../enum/installment/installment_status.enum.js';
import type { PaymentMethod } from '../../enum/payment/payment_method.enum.js';
import type { ReceivableStatus } from '../../enum/receivable/receivable_status.enum.js';

export type PaymentSplitDto = {
  method: PaymentMethod;
  amountCents: number;
  cardBrand: string | null;
  installmentsQty: number | null;
};

export type PaymentDto = {
  id: string;
  installmentId: string;
  amountCents: number;
  receivedAt: string;
  receiptNumber: number;
  cashSessionId: string | null;
  notes: string | null;
  reversedAt: string | null;
  reversalReason: string | null;
  splits: PaymentSplitDto[];
};

export type InstallmentDto = {
  id: string;
  receivableId: string;
  patientId: string;
  unitId: string;
  number: number;
  dueDate: string;
  amountCents: number;
  paidCents: number;
  status: InstallmentStatus;
  paidAt: string | null;
};

export type ReceivableListItemDto = {
  id: string;
  patientId: string;
  unitId: string;
  totalCents: number;
  installmentCount: number;
  status: ReceivableStatus;
  description: string | null;
  createdAt: string;
};

export type ReceivableDetailDto = ReceivableListItemDto & {
  quoteId: string | null;
  categoryId: string | null;
  installments: Array<InstallmentDto & { payments: PaymentDto[] }>;
};

export type ReceivableListResult = {
  items: ReceivableListItemDto[];
  nextCursor: string | null;
};

export type InstallmentListResult = {
  items: InstallmentDto[];
  nextCursor: string | null;
};

export type PaymentRegisterResult = {
  paymentId: string;
  receiptNumber: number;
  installmentStatus: InstallmentStatus;
  creditCentsGranted: number;
  cashSessionId: string | null;
};

export type PaymentReverseResult = {
  paymentId: string;
  reversedAt: string;
  installmentStatus: InstallmentStatus;
};

export type PatientCreditDto = {
  patientId: string;
  balanceCents: number;
};
