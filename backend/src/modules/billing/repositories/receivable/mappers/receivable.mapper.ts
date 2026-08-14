import type { PaymentMethod } from '../../../enum/payment/payment_method.enum.js';
import type { InstallmentStatus } from '../../../enum/installment/installment_status.enum.js';
import type { ReceivableStatus } from '../../../enum/receivable/receivable_status.enum.js';
import { dateOnly, toJsonCents } from '../../../helpers/money.helper.js';
import type {
  InstallmentDto,
  PaymentDto,
  ReceivableDetailDto,
  ReceivableListItemDto,
} from '../../../types/receivable/receivable_http.types.js';

type SplitRow = {
  method: string;
  amountCents: bigint;
  cardBrand: string | null;
  installmentsQty: number | null;
};

type PaymentRow = {
  id: string;
  installmentId: string;
  amountCents: bigint;
  receivedAt: Date;
  receiptNumber: bigint;
  cashSessionId: string | null;
  notes: string | null;
  reversedAt: Date | null;
  reversalReason: string | null;
  splits: SplitRow[];
};

type InstallmentRow = {
  id: string;
  receivableId: string;
  number: number;
  dueDate: Date;
  amountCents: bigint;
  paidCents: bigint;
  status: string;
  paidAt: Date | null;
  receivable: { patientId: string; unitId: string };
  payments?: PaymentRow[];
};

type ReceivableRow = {
  id: string;
  patientId: string;
  unitId: string;
  totalCents: bigint;
  installmentCount: number;
  status: string;
  description: string | null;
  createdAt: Date;
  quoteId?: string | null;
  categoryId?: string | null;
  lines?: InstallmentRow[];
};

export function toPaymentDto(row: PaymentRow): PaymentDto {
  return {
    id: row.id,
    installmentId: row.installmentId,
    amountCents: toJsonCents(row.amountCents),
    receivedAt: row.receivedAt.toISOString(),
    receiptNumber: Number(row.receiptNumber),
    cashSessionId: row.cashSessionId,
    notes: row.notes,
    reversedAt: row.reversedAt?.toISOString() ?? null,
    reversalReason: row.reversalReason,
    splits: row.splits.map((split) => ({
      method: split.method as PaymentMethod,
      amountCents: toJsonCents(split.amountCents),
      cardBrand: split.cardBrand,
      installmentsQty: split.installmentsQty,
    })),
  };
}

export function toInstallmentDto(row: InstallmentRow): InstallmentDto {
  return {
    id: row.id,
    receivableId: row.receivableId,
    patientId: row.receivable.patientId,
    unitId: row.receivable.unitId,
    number: row.number,
    dueDate: dateOnly(row.dueDate),
    amountCents: toJsonCents(row.amountCents),
    paidCents: toJsonCents(row.paidCents),
    status: row.status as InstallmentStatus,
    paidAt: row.paidAt?.toISOString() ?? null,
  };
}

export function toReceivableListItemDto(row: ReceivableRow): ReceivableListItemDto {
  return {
    id: row.id,
    patientId: row.patientId,
    unitId: row.unitId,
    totalCents: toJsonCents(row.totalCents),
    installmentCount: row.installmentCount,
    status: row.status as ReceivableStatus,
    description: row.description,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toReceivableDetailDto(row: ReceivableRow & { lines: InstallmentRow[] }): ReceivableDetailDto {
  return {
    ...toReceivableListItemDto(row),
    quoteId: row.quoteId ?? null,
    categoryId: row.categoryId ?? null,
    installments: row.lines.map((line) => ({
      ...toInstallmentDto(line),
      payments: (line.payments ?? []).map(toPaymentDto),
    })),
  };
}
