import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import type { FinancialCategoryKind } from '../../enum/financial_category/financial_category_kind.enum.js';
import type { FinancialCategoryDto } from '../../types/financial_category/financial_category.types.js';

export class CreateRepository {
  async execute(
    ctx: RequestContext,
    persist: { name: string; kind: FinancialCategoryKind; parentId: string | null },
  ): Promise<FinancialCategoryDto> {
    const row = await getTenantPrisma().runInTenantContext(ctx, (tx) =>
      tx.financialCategory.create({
        data: {
          id: idGenerator.next(),
          tenantId: ctx.tenantId,
          name: persist.name,
          kind: persist.kind,
          parentId: persist.parentId,
          active: true,
        },
      }),
    );
    return {
      id: row.id,
      name: row.name,
      kind: row.kind as FinancialCategoryKind,
      parentId: row.parentId,
      active: row.active,
    };
  }
}
