import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { DataSubjectRequestDueRow } from '../../types/data_subject_request/data_subject_request.types.js';
import type { DsrType } from '../../enum/data_subject_request/data_subject_request_type.enum.js';

export class ListDueRepository {
  async execute(ctx: RequestContext): Promise<DataSubjectRequestDueRow[]> {
    return getTenantPrisma().runInTenantContext(ctx, async (tx) => {
      const rows = await tx.dataSubjectRequest.findMany({
        where: {
          tenantId: ctx.tenantId,
          status: { in: ['RECEIVED', 'IN_PROGRESS'] },
        },
        select: {
          id: true,
          type: true,
          dueAt: true,
        },
      });
      return rows.map((row) => ({
        id: row.id,
        type: row.type as DsrType,
        dueAt: row.dueAt,
      }));
    });
  }
}
