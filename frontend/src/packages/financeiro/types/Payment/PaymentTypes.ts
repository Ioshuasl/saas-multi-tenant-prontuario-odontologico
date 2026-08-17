import type { InstallmentStatus } from '@/packages/financeiro/enum/Installment/InstallmentStatusEnum';
import type { PaymentMethod } from '@/packages/financeiro/enum/Payment/PaymentMethodEnum';
import type { ReceiptSendChannel } from '@/packages/financeiro/enum/Payment/ReceiptSendChannelEnum';

export type PaymentSplitInput = {
  method: PaymentMethod;
  amountCents: number;
  cardBrand?: string | null;
  installmentsQty?: number | null;
};

export type PaymentCreateInput = {
  amountCents: number;
  receivedAt?: string | null;
  notes?: string | null;
  splits: PaymentSplitInput[];
};

export type PaymentCreateResult = {
  paymentId: string;
  receiptNumber: number;
  installmentStatus: InstallmentStatus;
  creditCentsGranted: number;
  cashSessionId: string | null;
};

export type PaymentReceiptResult = {
  url: string;
  expiresIn: number;
};

export type PaymentSendReceiptInput = {
  channel: ReceiptSendChannel;
};

export type PaymentSendReceiptResult = {
  sentVia: ReceiptSendChannel;
  receiptNumber: number;
  copyText?: string;
};

export type PatientCredit = {
  patientId: string;
  balanceCents: number;
};

export type FinanceiroPatientOption = {
  id: string;
  code: number;
  name: string;
  socialName: string | null;
};
