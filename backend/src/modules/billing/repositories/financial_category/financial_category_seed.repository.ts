import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import { DEFAULT_FINANCIAL_CATEGORIES } from '../../helpers/financial_category_seed.helper.js';

export class SeedRepository {
  async executeInTx(
    tx: DbTransaction,
    input: { tenantId: string; idNext?: () => string },
  ): Promise<void> {
    const nextId = input.idNext ?? (() => idGenerator.next());
    for (const category of DEFAULT_FINANCIAL_CATEGORIES) {
      const existing = await tx.financialCategory.findFirst({
        where: { tenantId: input.tenantId, name: category.name, kind: category.kind },
      });
      if (existing) continue;
      await tx.financialCategory.create({
        data: {
          id: nextId(),
          tenantId: input.tenantId,
          name: category.name,
          kind: category.kind,
          active: true,
        },
      });
    }
  }
}
