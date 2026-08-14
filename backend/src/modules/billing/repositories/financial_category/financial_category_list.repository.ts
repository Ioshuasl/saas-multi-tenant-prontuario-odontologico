import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { FinancialCategoryKind } from '../../enum/financial_category/financial_category_kind.enum.js';
import type { FinancialCategoryListQuerySchema } from '../../schemas/billing.schema.js';
import type { FinancialCategoryDto } from '../../types/financial_category/financial_category.types.js';

export class ListRepository {
  async execute(
    ctx: RequestContext,
    query: FinancialCategoryListQuerySchema,
  ): Promise<FinancialCategoryDto[]> {
    const active = query.active === undefined ? true : query.active === 'true';
    const rows = await getTenantPrisma().runInTenantContext(ctx, (tx) =>
      tx.financialCategory.findMany({
        where: {
          ...(query.kind ? { kind: query.kind } : {}),
          ...(query.active === undefined ? { active: true } : { active }),
        },
        orderBy: [{ kind: 'asc' }, { name: 'asc' }],
      }),
    );
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      kind: row.kind as FinancialCategoryKind,
      parentId: row.parentId,
      active: row.active,
    }));
  }
}
