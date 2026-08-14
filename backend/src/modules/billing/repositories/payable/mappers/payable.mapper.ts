import type { Prisma } from '@prisma/client';
import type { PayableStatus } from '../../../enum/payable/payable_status.enum.js';
import type { PaymentMethod } from '../../../enum/payment/payment_method.enum.js';
import { dateOnly, toJsonCents } from '../../../helpers/money.helper.js';
import { effectivePayableStatus, parsePayableRecurrence } from '../../../models/overdue.model.js';
import type { PayableDto } from '../../../types/payable/payable.types.js';

export type PayableRow = {
  id: string;
  unitId: string;
  categoryId: string | null;
  supplier: string | null;
  description: string;
  amountCents: bigint;
  dueDate: Date;
  paidAt: Date | null;
  paidCents: bigint | null;
  method: string | null;
  recurrence: Prisma.JsonValue;
  status: string;
  payIdempotencyKey?: string | null;
};

export function toPayableDto(row: PayableRow, today: string): PayableDto {
  return {
    id: row.id,
    unitId: row.unitId,
    categoryId: row.categoryId,
    supplier: row.supplier,
    description: row.description,
    amountCents: toJsonCents(row.amountCents),
    dueDate: dateOnly(row.dueDate),
    paidAt: row.paidAt?.toISOString() ?? null,
    paidCents: row.paidCents === null ? null : toJsonCents(row.paidCents),
    method: (row.method as PaymentMethod | null) ?? null,
    recurrence: parsePayableRecurrence(row.recurrence),
    status: effectivePayableStatus(row.status as PayableStatus, row.dueDate, today),
  };
}
