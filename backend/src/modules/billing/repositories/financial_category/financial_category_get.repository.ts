import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';

export class GetRepository {
  async executeInTx(
    tx: DbTransaction,
    categoryId: string,
  ): Promise<{ id: string; kind: string } | null> {
    return tx.financialCategory.findFirst({
      where: { id: categoryId, active: true },
      select: { id: true, kind: true },
    });
  }

  async executeAnyInTx(
    tx: DbTransaction,
    categoryId: string,
  ): Promise<{ id: string; kind: string } | null> {
    return tx.financialCategory.findFirst({
      where: { id: categoryId },
      select: { id: true, kind: true },
    });
  }

  execute(ctx: RequestContext, categoryId: string) {
    return getTenantPrisma().runInTenantContext(ctx, (tx) => this.executeInTx(tx, categoryId));
  }

  executeAny(ctx: RequestContext, categoryId: string) {
    return getTenantPrisma().runInTenantContext(ctx, (tx) => this.executeAnyInTx(tx, categoryId));
  }
}
