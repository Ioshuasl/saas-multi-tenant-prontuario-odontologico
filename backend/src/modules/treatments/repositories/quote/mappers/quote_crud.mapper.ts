import type { QuoteStatus } from '../../../enum/quote/quote_status.enum.js';
import type { QuoteDto, QuoteItemDto, QuoteListItemDto } from '../../../types/quote/quote_crud.types.js';

type ItemRow = {
  id: string;
  procedureId: string;
  toothCode: string | null;
  face: string | null;
  quantity: number;
  unitPriceCents: bigint;
  discountCents: bigint;
  totalCents: bigint;
  sortOrder: number;
  approved: boolean;
  procedure: { name: string; code: string };
};

type InstallmentRow = {
  number: number;
  dueDate: Date;
  amountCents: bigint;
};

type ReceivableRow = {
  id: string;
  totalCents: bigint;
  lines: InstallmentRow[];
};

type QuoteRow = {
  id: string;
  number: bigint;
  status: string;
  patientId: string;
  professionalId: string;
  unitId: string;
  subtotalCents: bigint;
  discountCents: bigint;
  totalCents: bigint;
  validUntil: Date | null;
  notes: string | null;
  sentAt: Date | null;
  decidedAt: Date | null;
  rejectReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
  items?: ItemRow[];
  receivables?: ReceivableRow[];
};

function dateOnly(value: Date | null): string | null {
  if (!value) return null;
  return value.toISOString().slice(0, 10);
}

export function toQuoteItemDto(row: ItemRow): QuoteItemDto {
  return {
    id: row.id,
    procedureId: row.procedureId,
    procedureName: row.procedure.name,
    procedureCode: row.procedure.code,
    toothCode: row.toothCode,
    face: row.face,
    quantity: row.quantity,
    unitPriceCents: Number(row.unitPriceCents),
    discountCents: Number(row.discountCents),
    totalCents: Number(row.totalCents),
    sortOrder: row.sortOrder,
    approved: row.approved,
  };
}

function toReceivableDto(row: ReceivableRow): QuoteDto['receivable'] {
  const installments = [...row.lines]
    .sort((a, b) => a.number - b.number)
    .map((line) => ({
      number: line.number,
      dueDate: dateOnly(line.dueDate) ?? '',
      amountCents: Number(line.amountCents),
    }));
  const paidByInstallments = installments.reduce((acc, line) => acc + line.amountCents, 0);
  return {
    id: row.id,
    totalCents: Number(row.totalCents),
    downPaymentCents: Number(row.totalCents) - paidByInstallments,
    installments,
  };
}

export function toQuoteDto(row: QuoteRow): QuoteDto {
  const receivable = row.receivables?.[0] ? toReceivableDto(row.receivables[0]) : null;
  return {
    id: row.id,
    number: row.number.toString(),
    status: row.status as QuoteStatus,
    patientId: row.patientId,
    professionalId: row.professionalId,
    unitId: row.unitId,
    subtotalCents: Number(row.subtotalCents),
    discountCents: Number(row.discountCents),
    totalCents: Number(row.totalCents),
    validUntil: dateOnly(row.validUntil),
    notes: row.notes,
    sentAt: row.sentAt?.toISOString() ?? null,
    decidedAt: row.decidedAt?.toISOString() ?? null,
    rejectReason: row.rejectReason ?? null,
    items: (row.items ?? []).map(toQuoteItemDto),
    receivable,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toQuoteListItemDto(row: QuoteRow): QuoteListItemDto {
  const { items: _items, notes: _notes, receivable: _receivable, ...rest } = toQuoteDto({
    ...row,
    items: [],
    receivables: [],
  });
  void _items;
  void _notes;
  void _receivable;
  return rest;
}
