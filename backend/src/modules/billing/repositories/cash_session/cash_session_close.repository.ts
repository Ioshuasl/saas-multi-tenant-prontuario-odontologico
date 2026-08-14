import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import type { PaymentMethod } from '../../enum/payment/payment_method.enum.js';

export class CloseRepository {
  async executeInTx(
    tx: DbTransaction,
    persist: {
      sessionId: string;
      closedBy: string;
      closedAt: Date;
      countedCents: bigint;
      expectedCents: bigint;
      differenceCents: bigint;
      countedByMethod: Array<{ method: PaymentMethod; countedCents: number }>;
      expectedByMethod: Array<{ method: PaymentMethod; expectedCents: number }>;
      differenceReason: string | null;
      closeIdempotencyKey: string;
    },
  ): Promise<void> {
    await tx.cashSession.update({
      where: { id: persist.sessionId },
      data: {
        status: 'CLOSED',
        closedBy: persist.closedBy,
        closedAt: persist.closedAt,
        countedCents: persist.countedCents,
        expectedCents: persist.expectedCents,
        differenceCents: persist.differenceCents,
        countedByMethod: persist.countedByMethod,
        expectedByMethod: persist.expectedByMethod,
        differenceReason: persist.differenceReason,
        closeIdempotencyKey: persist.closeIdempotencyKey,
      },
    });
  }
}
