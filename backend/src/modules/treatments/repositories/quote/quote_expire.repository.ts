import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';

export class ListSentDueRepository {
  async execute(ctx: RequestContext, todayIso: string): Promise<string[]> {
    const cutoff = new Date(`${todayIso}T00:00:00.000Z`);
    return getTenantPrisma().runInTenantContext(ctx, async (tx) => {
      const rows = await tx.quote.findMany({
        where: {
          status: 'SENT',
          validUntil: { lt: cutoff },
        },
        select: { id: true },
      });
      return rows.map((row) => row.id);
    });
  }
}

export class ExpireManyRepository {
  async executeInTx(tx: DbTransaction, quoteIds: string[]): Promise<number> {
    if (quoteIds.length === 0) return 0;
    const result = await tx.quote.updateMany({
      where: { id: { in: quoteIds }, status: 'SENT' },
      data: { status: 'EXPIRED' },
    });
    return result.count;
  }
}
