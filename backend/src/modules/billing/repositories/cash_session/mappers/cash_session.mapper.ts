import type { Prisma } from '@prisma/client';
import type { CashMovementKind } from '../../../enum/cash_movement/cash_movement_kind.enum.js';
import type { CashSessionStatus } from '../../../enum/cash_session/cash_session_status.enum.js';
import type { PaymentMethod } from '../../../enum/payment/payment_method.enum.js';
import { toJsonCents } from '../../../helpers/money.helper.js';
import {
  expectedByMethod,
  openForHours,
  type MethodCents,
} from '../../../models/cash_session.model.js';
import type { CashSessionDto } from '../../../types/cash_session/cash_session.types.js';

type MovementRow = {
  id: string;
  kind: string;
  method: string;
  amountCents: bigint;
  description: string | null;
  paymentId: string | null;
  createdAt: Date;
};

type SessionRow = {
  id: string;
  unitId: string;
  status: string;
  openedBy: string;
  openedAt: Date;
  openingCents: bigint;
  openingByMethod: Prisma.JsonValue;
  countedCents: bigint | null;
  countedByMethod: Prisma.JsonValue;
  expectedCents: bigint | null;
  expectedByMethod: Prisma.JsonValue;
  differenceCents: bigint | null;
  differenceReason: string | null;
  closedAt: Date | null;
  movements: MovementRow[];
};

function asMethodList(value: Prisma.JsonValue): MethodCents[] {
  if (!Array.isArray(value)) return [];
  const rows: MethodCents[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const method = record.method;
    const amount = record.amountCents ?? record.countedCents ?? record.expectedCents;
    if (typeof method !== 'string' || typeof amount !== 'number') continue;
    rows.push({ method: method as PaymentMethod, amountCents: BigInt(amount) });
  }
  return rows;
}

export function toCashSessionDto(row: SessionRow, now = new Date()): CashSessionDto {
  const openingByMethod = asMethodList(row.openingByMethod);
  const live = expectedByMethod({
    openingCents: row.openingCents,
    openingByMethod,
    movements: row.movements.map((movement) => ({
      kind: movement.kind as CashMovementKind,
      method: movement.method as PaymentMethod,
      amountCents: movement.amountCents,
    })),
  });
  const hours = openForHours(row.openedAt, now);
  const counted = asMethodList(row.countedByMethod);

  return {
    id: row.id,
    unitId: row.unitId,
    status: row.status as CashSessionStatus,
    openedBy: row.openedBy,
    openedAt: row.openedAt.toISOString(),
    openingCents: toJsonCents(row.openingCents),
    openingByMethod: openingByMethod.map((row) => ({
      method: row.method,
      amountCents: toJsonCents(row.amountCents),
    })),
    expectedCents: toJsonCents(row.status === 'CLOSED' && row.expectedCents !== null ? row.expectedCents : live.expectedCents),
    expectedByMethod: (
      row.status === 'CLOSED' && row.expectedByMethod
        ? asMethodList(row.expectedByMethod)
        : live.expectedByMethod
    ).map((row) => ({
      method: row.method,
      expectedCents: toJsonCents(row.amountCents),
    })),
    countedCents: row.countedCents === null ? null : toJsonCents(row.countedCents),
    countedByMethod:
      row.countedByMethod === null
        ? null
        : counted.map((row) => ({
            method: row.method,
            countedCents: toJsonCents(row.amountCents),
          })),
    differenceCents: row.differenceCents === null ? null : toJsonCents(row.differenceCents),
    differenceReason: row.differenceReason,
    closedAt: row.closedAt?.toISOString() ?? null,
    openForHours: Math.round(hours * 10) / 10,
    openTooLong: hours > 24,
    movements: row.movements.map((movement) => ({
      id: movement.id,
      kind: movement.kind as CashMovementKind,
      method: movement.method as PaymentMethod,
      amountCents: toJsonCents(movement.amountCents),
      description: movement.description,
      paymentId: movement.paymentId,
      createdAt: movement.createdAt.toISOString(),
    })),
  };
}
