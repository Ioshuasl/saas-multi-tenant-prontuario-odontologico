import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import type { PaymentMethod } from '../../enum/payment/payment_method.enum.js';
import type { InstallmentStatus } from '../../enum/installment/installment_status.enum.js';

export type RegisterPaymentPersist = {
  installmentId: string;
  receivableId: string;
  unitId: string;
  patientId: string;
  amountCents: bigint;
  receivedAt: Date;
  receivedBy: string;
  notes: string | null;
  idempotencyKey: string;
  receiptNumber: bigint;
  cashSessionId: string | null;
  splits: Array<{
    method: PaymentMethod;
    amountCents: bigint;
    cardBrand: string | null;
    installmentsQty: number | null;
  }>;
  nextPaidCents: bigint;
  nextInstallmentStatus: InstallmentStatus;
  installmentPaidAt: Date | null;
  nextReceivableStatus: string;
  creditGrantedCents: bigint;
  creditConsumedCents: bigint;
  cashMovements: Array<{
    kind: 'PAYMENT_IN';
    amountCents: bigint;
    method: PaymentMethod;
  }>;
};

export class RegisterRepository {
  async executeInTx(
    tx: DbTransaction,
    ctx: RequestContext,
    persist: RegisterPaymentPersist,
  ): Promise<string> {
    const paymentId = idGenerator.next();
    await tx.payment.create({
      data: {
        id: paymentId,
        tenantId: ctx.tenantId,
        unitId: persist.unitId,
        installmentId: persist.installmentId,
        cashSessionId: persist.cashSessionId,
        amountCents: persist.amountCents,
        receivedAt: persist.receivedAt,
        receivedBy: persist.receivedBy,
        receiptNumber: persist.receiptNumber,
        notes: persist.notes,
        idempotencyKey: persist.idempotencyKey,
      },
    });

    for (const split of persist.splits) {
      await tx.paymentSplit.create({
        data: {
          id: idGenerator.next(),
          tenantId: ctx.tenantId,
          paymentId,
          method: split.method,
          amountCents: split.amountCents,
          cardBrand: split.cardBrand,
          installmentsQty: split.installmentsQty,
        },
      });
    }

    if (persist.creditGrantedCents > 0n) {
      await tx.patientCreditLedger.create({
        data: {
          id: idGenerator.next(),
          tenantId: ctx.tenantId,
          patientId: persist.patientId,
          paymentId,
          amountCents: persist.creditGrantedCents,
          kind: 'CREDIT',
        },
      });
    }
    if (persist.creditConsumedCents > 0n) {
      await tx.patientCreditLedger.create({
        data: {
          id: idGenerator.next(),
          tenantId: ctx.tenantId,
          patientId: persist.patientId,
          paymentId,
          amountCents: -persist.creditConsumedCents,
          kind: 'DEBIT',
        },
      });
    }

    if (persist.cashSessionId) {
      for (const movement of persist.cashMovements) {
        await tx.cashMovement.create({
          data: {
            id: idGenerator.next(),
            tenantId: ctx.tenantId,
            cashSessionId: persist.cashSessionId,
            kind: movement.kind,
            amountCents: movement.amountCents,
            method: movement.method,
            paymentId,
            createdBy: persist.receivedBy,
          },
        });
      }
    }

    await tx.installment.update({
      where: { id: persist.installmentId },
      data: {
        paidCents: persist.nextPaidCents,
        status: persist.nextInstallmentStatus,
        paidAt: persist.installmentPaidAt,
      },
    });
    await tx.receivable.update({
      where: { id: persist.receivableId },
      data: { status: persist.nextReceivableStatus },
    });

    return paymentId;
  }
}
