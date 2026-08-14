import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import { PROCEDURES_CATEGORY_NAME } from '../../helpers/financial_category_seed.helper.js';

export class SeedRepository {
  async executeInTx(
    tx: DbTransaction,
    input: { tenantId: string; idNext?: () => string },
  ): Promise<void> {
    const existing = await tx.financialCategory.findFirst({
      where: { tenantId: input.tenantId, name: PROCEDURES_CATEGORY_NAME, kind: 'REVENUE' },
    });
    if (existing) return;

    const nextId = input.idNext ?? (() => idGenerator.next());
    await tx.financialCategory.create({
      data: {
        id: nextId(),
        tenantId: input.tenantId,
        name: PROCEDURES_CATEGORY_NAME,
        kind: 'REVENUE',
        active: true,
      },
    });
  }
}
