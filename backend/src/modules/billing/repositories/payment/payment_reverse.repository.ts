import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import type { InstallmentStatus } from '../../enum/installment/installment_status.enum.js';

export type ReversePaymentPersist = {
  paymentId: string;
  installmentId: string;
  receivableId: string;
  patientId: string;
  reason: string;
  reversedBy: string;
  reversedAt: Date;
  reversalIdempotencyKey: string;
  nextPaidCents: bigint;
  nextInstallmentStatus: InstallmentStatus;
  installmentPaidAt: Date | null;
  nextReceivableStatus: string;
  reverseCreditGrantedCents: bigint;
  reverseCreditConsumedCents: bigint;
  cashSessionId: string | null;
  cashOut: Array<{ amountCents: bigint; method: string }>;
};

export class ReverseRepository {
  async executeInTx(
    tx: DbTransaction,
    ctx: RequestContext,
    persist: ReversePaymentPersist,
  ): Promise<void> {
    await tx.payment.update({
      where: { id: persist.paymentId },
      data: {
        reversedAt: persist.reversedAt,
        reversalReason: persist.reason,
        reversedBy: persist.reversedBy,
        reversalIdempotencyKey: persist.reversalIdempotencyKey,
      },
    });

    if (persist.reverseCreditGrantedCents > 0n) {
      await tx.patientCreditLedger.create({
        data: {
          id: idGenerator.next(),
          tenantId: ctx.tenantId,
          patientId: persist.patientId,
          paymentId: persist.paymentId,
          amountCents: -persist.reverseCreditGrantedCents,
          kind: 'REVERSE',
        },
      });
    }
    if (persist.reverseCreditConsumedCents > 0n) {
      await tx.patientCreditLedger.create({
        data: {
          id: idGenerator.next(),
          tenantId: ctx.tenantId,
          patientId: persist.patientId,
          paymentId: persist.paymentId,
          amountCents: persist.reverseCreditConsumedCents,
          kind: 'REVERSE',
        },
      });
    }

    if (persist.cashSessionId) {
      for (const movement of persist.cashOut) {
        await tx.cashMovement.create({
          data: {
            id: idGenerator.next(),
            tenantId: ctx.tenantId,
            cashSessionId: persist.cashSessionId,
            kind: 'PAYMENT_OUT',
            amountCents: movement.amountCents,
            method: movement.method,
            paymentId: persist.paymentId,
            createdBy: persist.reversedBy,
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
  }
}
