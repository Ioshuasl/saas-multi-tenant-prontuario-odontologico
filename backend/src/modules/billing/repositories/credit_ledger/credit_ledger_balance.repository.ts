import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';

export class BalanceRepository {
  async executeInTx(tx: DbTransaction, patientId: string): Promise<bigint> {
    const result = await tx.patientCreditLedger.aggregate({
      where: { patientId },
      _sum: { amountCents: true },
    });
    return result._sum.amountCents ?? 0n;
  }

  async execute(ctx: RequestContext, patientId: string): Promise<bigint> {
    return getTenantPrisma().runInTenantContext(ctx, (tx) => this.executeInTx(tx, patientId));
  }
}
