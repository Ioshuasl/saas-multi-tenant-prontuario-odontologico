import type { PaymentMethod } from '../../enum/payment/payment_method.enum.js';
import type { ReceiptSendChannel } from '../../enum/receipt/send_channel.enum.js';

export type ReceiptPdfResult = {
  url: string;
  expiresIn: number;
};

export type ReceiptSendResult = {
  sentVia: ReceiptSendChannel;
  receiptNumber: number;
  copyText?: string;
};

export type ReceiptSnapshot = {
  paymentId: string;
  unitId: string;
  patientId: string;
  receivableId: string;
  installmentNumber: number;
  amountCents: bigint;
  receivedAt: Date;
  receivedBy: string;
  issuerName: string;
  receiptNumber: bigint;
  pdfStorageKey: string | null;
  splits: Array<{
    method: PaymentMethod;
    amountCents: bigint;
  }>;
};
