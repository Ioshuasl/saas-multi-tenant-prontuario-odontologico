import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { DbTransaction } from '../../../../shared/database/db_transaction.js';

export type DecideQuotePersist = {
  quoteId: string;
  status: 'APPROVED' | 'PARTIALLY_APPROVED' | 'REJECTED';
  decidedBy: string;
  rejectReason: string | null;
  idempotencyKey: string;
  approvedIds: string[];
};

export class DecideRepository {
  async executeInTx(tx: DbTransaction, ctx: RequestContext, persist: DecideQuotePersist): Promise<void> {
    await tx.quote.update({
      where: { id: persist.quoteId },
      data: {
        status: persist.status,
        decidedAt: new Date(),
        decidedBy: persist.decidedBy,
        rejectReason: persist.rejectReason,
        idempotencyKey: persist.idempotencyKey,
      },
    });

    if (persist.status === 'REJECTED') {
      await tx.quoteItem.updateMany({
        where: { quoteId: persist.quoteId, tenantId: ctx.tenantId },
        data: { approved: false },
      });
      return;
    }

    await tx.quoteItem.updateMany({
      where: { quoteId: persist.quoteId, tenantId: ctx.tenantId, id: { in: persist.approvedIds } },
      data: { approved: true },
    });
    await tx.quoteItem.updateMany({
      where: {
        quoteId: persist.quoteId,
        tenantId: ctx.tenantId,
        id: { notIn: persist.approvedIds },
      },
      data: { approved: false },
    });
  }
}
