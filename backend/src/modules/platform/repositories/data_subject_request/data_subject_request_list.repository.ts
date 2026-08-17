import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type {
  DataSubjectRequestListQuery,
  DataSubjectRequestListResult,
  DataSubjectRequestView,
} from '../../types/data_subject_request/data_subject_request.types.js';
import { mapDataSubjectRequest, toDataSubjectRequestView } from './mappers/data_subject_request.mapper.js';

function toView(row: ReturnType<typeof mapDataSubjectRequest>): DataSubjectRequestView {
  return toDataSubjectRequestView(row);
}

export class ListRepository {
  async execute(
    ctx: RequestContext,
    query: DataSubjectRequestListQuery,
  ): Promise<DataSubjectRequestListResult> {
    return getTenantPrisma().runInTenantContext(ctx, async (tx) => {
      const cursorRow = query.cursor
        ? await tx.dataSubjectRequest.findFirst({
            where: { id: query.cursor, tenantId: ctx.tenantId },
            select: { id: true, requestedAt: true },
          })
        : null;

      const rows = await tx.dataSubjectRequest.findMany({
        where: {
          tenantId: ctx.tenantId,
          ...(query.patientId ? { patientId: query.patientId } : {}),
          ...(query.status ? { status: query.status } : {}),
          ...(query.type ? { type: query.type } : {}),
          ...(cursorRow
            ? {
                OR: [
                  { requestedAt: { lt: cursorRow.requestedAt } },
                  { requestedAt: cursorRow.requestedAt, id: { lt: cursorRow.id } },
                ],
              }
            : {}),
        },
        orderBy: [{ requestedAt: 'desc' }, { id: 'desc' }],
        take: query.limit + 1,
      });

      const page = rows.slice(0, query.limit);
      return {
        items: page.map((row) => toView(mapDataSubjectRequest(row))),
        nextCursor: rows.length > query.limit ? (page[page.length - 1]?.id ?? null) : null,
      };
    });
  }
}
