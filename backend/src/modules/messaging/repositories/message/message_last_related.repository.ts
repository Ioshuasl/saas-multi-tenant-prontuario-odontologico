import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';

export class GetLastRelatedRepository {
  async execute(
    ctx: RequestContext,
    conversationId: string,
    relatedType: string,
  ): Promise<{ relatedId: string } | null> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const row = await tx.message.findFirst({
        where: {
          tenantId: ctx.tenantId,
          conversationId,
          direction: 'OUTBOUND',
          relatedType,
          relatedId: { not: null },
        },
        orderBy: { createdAt: 'desc' },
        select: { relatedId: true },
      });
      return row?.relatedId ? { relatedId: row.relatedId } : null;
    });
  }
}
