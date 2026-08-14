import type { DbTransaction } from '../../../../shared/database/db_transaction.js';

export class GetOpenRepository {
  async executeInTx(
    tx: DbTransaction,
    input: { unitId: string; openedBy: string },
  ): Promise<{ id: string; status: string } | null> {
    return tx.cashSession.findFirst({
      where: { unitId: input.unitId, openedBy: input.openedBy, status: 'OPEN' },
      select: { id: true, status: true },
    });
  }
}
