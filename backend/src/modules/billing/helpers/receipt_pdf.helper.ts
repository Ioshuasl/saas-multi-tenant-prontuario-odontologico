import PDFDocument from 'pdfkit';
import { receiptAmountInWords } from './receipt_amount_in_words.helper.js';
import type { PaymentMethod } from '../enum/payment/payment_method.enum.js';

export type ReceiptPdfInput = {
  clinicName: string;
  legalName: string | null;
  taxId: string | null;
  phone: string | null;
  addressLine: string | null;
  patientName: string;
  patientCode: number;
  receiptNumber: number;
  amountCents: bigint;
  receivedAt: string;
  issuerName: string;
  receivableId: string;
  installmentNumber: number;
  methods: Array<{ method: PaymentMethod; amountCents: bigint }>;
};

const METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: 'Dinheiro',
  DEBIT_CARD: 'Débito',
  CREDIT_CARD: 'Crédito',
  PIX: 'Pix',
  BANK_TRANSFER: 'Transferência',
  CHECK: 'Cheque',
  INSURANCE: 'Convênio',
  PATIENT_CREDIT: 'Crédito do paciente',
};

export function formatMoneyLabel(cents: number | bigint): string {
  const value = typeof cents === 'bigint' ? Number(cents) : cents;
  return (value / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function receiptPdfStorageKey(tenantId: string, paymentId: string): string {
  return `tenants/${tenantId}/receipts/${paymentId}.pdf`;
}

/** Recibo comercial — sem dente, diagnóstico ou texto clínico. */
export function renderReceiptPdf(input: ReceiptPdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 48 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const amount = Number(input.amountCents);
    doc.fontSize(16).text(input.clinicName);
    if (input.legalName) doc.fontSize(10).text(input.legalName);
    if (input.taxId) doc.fontSize(10).text(`CNPJ ${input.taxId}`);
    if (input.addressLine) doc.fontSize(10).text(input.addressLine);
    if (input.phone) doc.fontSize(10).text(input.phone);

    doc.moveDown();
    doc.fontSize(14).text(`Recibo nº ${input.receiptNumber}`);
    doc.fontSize(10).text(`Paciente: ${input.patientName} (ficha ${input.patientCode})`);
    doc.text(`Referência: título ${input.receivableId} · parcela ${input.installmentNumber}`);
    doc.text(`Data: ${input.receivedAt}`);
    doc.text(`Emitido por: ${input.issuerName}`);

    doc.moveDown();
    doc.fontSize(12).text(`Valor: ${formatMoneyLabel(amount)}`);
    doc.fontSize(10).text(`Por extenso: ${receiptAmountInWords(input.amountCents)}`);

    doc.moveDown();
    doc.fontSize(11).text('Formas de pagamento');
    for (const split of input.methods) {
      doc.fontSize(10).text(`${METHOD_LABEL[split.method]}: ${formatMoneyLabel(split.amountCents)}`);
    }

    doc.moveDown(2);
    doc.fontSize(9).text('Este documento não é nota fiscal.');
    doc.end();
  });
}
