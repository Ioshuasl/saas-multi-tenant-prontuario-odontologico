import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { AuditAction } from '../../../../shared/database/write_audit.js';

export class GetRecentAnomalyRepository {
  async execute(
    ctx: RequestContext,
    input: { actorId: string; since: Date },
  ): Promise<boolean> {
    return getTenantPrisma().runInTenantContext(ctx, async (tx) => {
      const row = await tx.auditLog.findFirst({
        where: {
          tenantId: ctx.tenantId,
          action: AuditAction.ANOMALY_TRIGGERED,
          resourceType: 'user',
          resourceId: input.actorId,
          createdAt: { gte: input.since },
        },
        select: { id: true },
      });
      return Boolean(row);
    });
  }
}
