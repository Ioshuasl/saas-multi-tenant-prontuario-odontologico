import PDFDocument from 'pdfkit';

export type QuotePdfLine = {
  procedureName: string;
  toothCode: string | null;
  face: string | null;
  quantity: number;
  unitPriceCents: number;
  discountCents: number;
  totalCents: number;
};

export type QuotePdfInput = {
  clinicName: string;
  legalName: string | null;
  taxId: string | null;
  phone: string | null;
  addressLine: string | null;
  responsibleCro: string | null;
  patientName: string;
  patientCode: number;
  quoteNumber: string;
  validUntil: string | null;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  items: QuotePdfLine[];
};

function brl(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** PDF comercial — sem evolução, anamnese ou diagnóstico. */
export function renderQuotePdf(input: QuotePdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 48 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(16).text(input.clinicName);
    if (input.legalName) doc.fontSize(10).text(input.legalName);
    if (input.taxId) doc.fontSize(10).text(`CNPJ ${input.taxId}`);
    if (input.addressLine) doc.fontSize(10).text(input.addressLine);
    if (input.phone) doc.fontSize(10).text(input.phone);
    if (input.responsibleCro) doc.fontSize(10).text(`CRO responsável técnico: ${input.responsibleCro}`);

    doc.moveDown();
    doc.fontSize(14).text(`Orçamento nº ${input.quoteNumber}`);
    doc.fontSize(10).text(`Paciente: ${input.patientName} (ficha ${input.patientCode})`);
    if (input.validUntil) doc.text(`Validade: ${input.validUntil}`);

    doc.moveDown();
    doc.fontSize(11).text('Itens');
    for (const item of input.items) {
      const loc = [item.toothCode, item.face].filter(Boolean).join('/');
      const label = loc ? `${item.procedureName} (${loc})` : item.procedureName;
      doc.fontSize(10).text(`${label} × ${item.quantity}  ${brl(item.totalCents)}`);
    }

    doc.moveDown();
    doc.text(`Subtotal: ${brl(input.subtotalCents)}`);
    if (input.discountCents > 0) doc.text(`Desconto: ${brl(input.discountCents)}`);
    doc.fontSize(12).text(`Total: ${brl(input.totalCents)}`);

    doc.moveDown(2);
    doc.fontSize(10).text('Assinatura do paciente / responsável: _______________________________');
    doc.moveDown();
    doc.fontSize(8).text('Documento comercial. Não substitui contrato nem prontuário clínico.');
    doc.end();
  });
}

export function nextQuotePdfStorageKey(tenantId: string, quoteId: string, previousKey: string | null): string {
  const match = previousKey?.match(/\/v(\d+)\.pdf$/);
  const version = match ? Number(match[1]) + 1 : 1;
  return `tenants/${tenantId}/quotes/${quoteId}/v${version}.pdf`;
}

export function formatQuoteTotalLabel(totalCents: number): string {
  return brl(totalCents);
}
