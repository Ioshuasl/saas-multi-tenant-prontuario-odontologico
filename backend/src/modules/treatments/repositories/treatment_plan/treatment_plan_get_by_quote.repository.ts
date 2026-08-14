import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';

export class GetByQuoteRepository {
  async executeInTx(
    tx: DbTransaction,
    quoteId: string,
  ): Promise<{ id: string; itemCount: number } | null> {
    const row = await tx.treatmentPlan.findFirst({
      where: { quoteId },
      include: { _count: { select: { items: true } } },
    });
    if (!row) return null;
    return { id: row.id, itemCount: row._count.items };
  }

  async execute(ctx: RequestContext, quoteId: string): Promise<{ id: string; itemCount: number } | null> {
    return getTenantPrisma().runInTenantContext(ctx, (tx) => this.executeInTx(tx, quoteId));
  }
}
