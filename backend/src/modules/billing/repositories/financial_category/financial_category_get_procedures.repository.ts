import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import { PROCEDURES_CATEGORY_NAME } from '../../helpers/financial_category_seed.helper.js';

export class GetProceduresRepository {
  async executeInTx(tx: DbTransaction, tenantId: string): Promise<{ id: string } | null> {
    return tx.financialCategory.findFirst({
      where: { tenantId, name: PROCEDURES_CATEGORY_NAME, kind: 'REVENUE', active: true },
      select: { id: true },
    });
  }
}
