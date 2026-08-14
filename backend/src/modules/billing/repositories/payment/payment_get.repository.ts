import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { InstallmentStatus } from '../../enum/installment/installment_status.enum.js';
import type { PaymentMethod } from '../../enum/payment/payment_method.enum.js';

export type InstallmentForPayment = {
  id: string;
  receivableId: string;
  amountCents: bigint;
  paidCents: bigint;
  status: InstallmentStatus;
  paidAt: Date | null;
  unitId: string;
  patientId: string;
  receivableStatus: string;
};

export type StoredPayment = {
  id: string;
  installmentId: string;
  amountCents: bigint;
  receiptNumber: bigint;
  cashSessionId: string | null;
  notes: string | null;
  reversedAt: Date | null;
  reversalReason: string | null;
  reversalIdempotencyKey: string | null;
  cashSessionStatus: string | null;
  installmentStatus: InstallmentStatus;
  splits: Array<{
    method: PaymentMethod;
    amountCents: bigint;
    cardBrand: string | null;
    installmentsQty: number | null;
  }>;
  creditGrantedCents: bigint;
  creditConsumedCents: bigint;
};

const paymentInclude = {
  splits: true,
  cashSession: { select: { status: true } },
  creditLedger: { select: { kind: true, amountCents: true } },
  installment: { select: { status: true } },
} as const;

function toStored(row: {
  id: string;
  installmentId: string;
  amountCents: bigint;
  receiptNumber: bigint;
  cashSessionId: string | null;
  notes: string | null;
  reversedAt: Date | null;
  reversalReason: string | null;
  reversalIdempotencyKey: string | null;
  splits: Array<{
    method: string;
    amountCents: bigint;
    cardBrand: string | null;
    installmentsQty: number | null;
  }>;
  cashSession: { status: string } | null;
  installment: { status: string };
  creditLedger: Array<{ kind: string; amountCents: bigint }>;
}): StoredPayment {
  let creditGrantedCents = 0n;
  let creditConsumedCents = 0n;
  for (const entry of row.creditLedger) {
    if (entry.kind === 'CREDIT') creditGrantedCents += entry.amountCents;
    if (entry.kind === 'DEBIT') creditConsumedCents += -entry.amountCents;
  }
  return {
    id: row.id,
    installmentId: row.installmentId,
    amountCents: row.amountCents,
    receiptNumber: row.receiptNumber,
    cashSessionId: row.cashSessionId,
    notes: row.notes,
    reversedAt: row.reversedAt,
    reversalReason: row.reversalReason,
    reversalIdempotencyKey: row.reversalIdempotencyKey,
    cashSessionStatus: row.cashSession?.status ?? null,
    installmentStatus: row.installment.status as InstallmentStatus,
    splits: row.splits.map((split) => ({
      method: split.method as PaymentMethod,
      amountCents: split.amountCents,
      cardBrand: split.cardBrand,
      installmentsQty: split.installmentsQty,
    })),
    creditGrantedCents,
    creditConsumedCents,
  };
}

export class GetForPaymentRepository {
  async executeInTx(tx: DbTransaction, installmentId: string): Promise<InstallmentForPayment | null> {
    const row = await tx.installment.findFirst({
      where: { id: installmentId },
      include: { receivable: { select: { id: true, unitId: true, patientId: true, status: true } } },
    });
    if (!row) return null;
    return {
      id: row.id,
      receivableId: row.receivableId,
      amountCents: row.amountCents,
      paidCents: row.paidCents,
      status: row.status as InstallmentStatus,
      paidAt: row.paidAt,
      unitId: row.receivable.unitId,
      patientId: row.receivable.patientId,
      receivableStatus: row.receivable.status,
    };
  }
}

export class ListStatusesRepository {
  async executeInTx(
    tx: DbTransaction,
    receivableId: string,
  ): Promise<Array<{ id: string; status: InstallmentStatus }>> {
    const rows = await tx.installment.findMany({
      where: { receivableId },
      select: { id: true, status: true },
    });
    return rows.map((row) => ({ id: row.id, status: row.status as InstallmentStatus }));
  }
}

export class FindByIdempotencyRepository {
  async execute(ctx: RequestContext, idempotencyKey: string): Promise<StoredPayment | null> {
    const row = await getTenantPrisma().runInTenantContext(ctx, (tx) =>
      tx.payment.findFirst({
        where: { idempotencyKey },
        include: paymentInclude,
      }),
    );
    return row ? toStored(row) : null;
  }

  async executeInTx(
    tx: DbTransaction,
    idempotencyKey: string,
  ): Promise<StoredPayment | null> {
    const row = await tx.payment.findFirst({
      where: { idempotencyKey },
      include: paymentInclude,
    });
    return row ? toStored(row) : null;
  }
}

export class FindByReversalIdempotencyRepository {
  async execute(ctx: RequestContext, reversalIdempotencyKey: string): Promise<StoredPayment | null> {
    const row = await getTenantPrisma().runInTenantContext(ctx, (tx) =>
      tx.payment.findFirst({
        where: { reversalIdempotencyKey },
        include: paymentInclude,
      }),
    );
    return row ? toStored(row) : null;
  }
}

export class GetPaymentRepository {
  async executeInTx(tx: DbTransaction, paymentId: string): Promise<StoredPayment | null> {
    const row = await tx.payment.findFirst({
      where: { id: paymentId },
      include: paymentInclude,
    });
    return row ? toStored(row) : null;
  }
}
