import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { CLINICAL_READ_ACTIONS } from '../../../../shared/database/write_audit.js';

export type ClinicalReadBurst = {
  actorId: string;
  count: number;
};

export class ListBurstRepository {
  async execute(
    ctx: RequestContext,
    input: { since: Date; threshold: number },
  ): Promise<ClinicalReadBurst[]> {
    return getTenantPrisma().runInTenantContext(ctx, async (tx) => {
      const rows = await tx.auditLog.groupBy({
        by: ['actorId'],
        where: {
          tenantId: ctx.tenantId,
          action: { in: [...CLINICAL_READ_ACTIONS] },
          createdAt: { gte: input.since },
          actorId: { not: null },
        },
        _count: { _all: true },
      });
      return rows
        .filter((row) => row.actorId && row._count._all > input.threshold)
        .map((row) => ({ actorId: row.actorId as string, count: row._count._all }));
    });
  }
}
