import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { civilDateUtc } from '../../helpers/civil_date.helper.js';

export class HasOverdueRepository {
  async executeInTx(tx: DbTransaction, patientId: string, today: string): Promise<boolean> {
    const todayDate = civilDateUtc(today);
    const found = await tx.installment.findFirst({
      where: {
        receivable: { patientId },
        OR: [
          { status: 'OVERDUE' },
          { status: { in: ['OPEN', 'PARTIALLY_PAID'] }, dueDate: { lt: todayDate } },
        ],
      },
      select: { id: true },
    });
    return Boolean(found);
  }

  execute(ctx: RequestContext, patientId: string, today: string) {
    return getTenantPrisma().runInTenantContext(ctx, (tx) => this.executeInTx(tx, patientId, today));
  }
}

export class ListDueOpenRepository {
  async executeInTx(tx: DbTransaction, today: string) {
    const todayDate = civilDateUtc(today);
    return tx.installment.findMany({
      where: {
        status: { in: ['OPEN', 'PARTIALLY_PAID'] },
        dueDate: { lt: todayDate },
      },
      select: {
        id: true,
        receivableId: true,
        receivable: { select: { patientId: true } },
      },
    });
  }
}

export class MarkOverdueRepository {
  async executeInTx(tx: DbTransaction, installmentIds: string[]): Promise<number> {
    if (installmentIds.length === 0) return 0;
    const result = await tx.installment.updateMany({
      where: { id: { in: installmentIds }, status: { in: ['OPEN', 'PARTIALLY_PAID'] } },
      data: { status: 'OVERDUE' },
    });
    return result.count;
  }
}
