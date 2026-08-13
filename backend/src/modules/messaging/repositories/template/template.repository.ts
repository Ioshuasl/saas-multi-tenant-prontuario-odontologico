import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { mapTemplate } from '../../helpers/messaging_mapper.helper.js';
import type { MessageTemplateSummary } from '../../types/messaging.types.js';

export class ListTemplatesRepository {
  async execute(ctx: RequestContext): Promise<MessageTemplateSummary[]> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const rows = await tx.messageTemplate.findMany({
        where: { OR: [{ tenantId: null }, { tenantId: ctx.tenantId }] },
        orderBy: [{ key: 'asc' }, { tenantId: 'asc' }],
      });
      const byKey = new Map<string, MessageTemplateSummary>();
      for (const row of rows) {
        const mapped = mapTemplate(row);
        const current = byKey.get(mapped.key);
        if (!current || (current.global && !mapped.global)) {
          byKey.set(mapped.key, mapped);
        }
      }
      return [...byKey.values()];
    });
  }
}

export class GetTemplateByKeyRepository {
  async execute(ctx: RequestContext, key: string): Promise<MessageTemplateSummary | null> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const tenantRow = await tx.messageTemplate.findFirst({
        where: { tenantId: ctx.tenantId, key },
      });
      if (tenantRow) return mapTemplate(tenantRow);
      const globalRow = await tx.messageTemplate.findFirst({
        where: { tenantId: null, key },
      });
      return globalRow ? mapTemplate(globalRow) : null;
    });
  }
}
