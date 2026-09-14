import type { Prisma } from '@prisma/client';
import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { AuditAction, CLINICAL_READ_ACTIONS } from '../../../../shared/database/write_audit.js';
import type {
  AuditLogListQuery,
  AuditLogListResult,
} from '../../types/audit_log/audit_log_list.types.js';
import { mapAuditLog } from './mappers/audit_log.mapper.js';

function actionFilter(action?: string): Prisma.AuditLogWhereInput['action'] | undefined {
  if (!action) return undefined;
  if (action === AuditAction.CLINICAL_READ || action === AuditAction.READ) {
    return { in: [...CLINICAL_READ_ACTIONS] };
  }
  return action;
}

export class ListRepository {
  async execute(ctx: RequestContext, query: AuditLogListQuery): Promise<AuditLogListResult> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const cursorRow = query.cursor
        ? await tx.auditLog.findFirst({
            where: { id: query.cursor, tenantId: ctx.tenantId },
            select: { id: true, createdAt: true },
          })
        : null;

      const rows = await tx.auditLog.findMany({
        where: {
          tenantId: ctx.tenantId,
          createdAt: { gte: query.from, lte: query.to },
          ...(query.patientId ? { patientId: query.patientId } : {}),
          ...(query.actorId ? { actorId: query.actorId } : {}),
          ...(query.action ? { action: actionFilter(query.action) } : {}),
          ...(cursorRow
            ? {
                OR: [
                  { createdAt: { lt: cursorRow.createdAt } },
                  { createdAt: cursorRow.createdAt, id: { lt: cursorRow.id } },
                ],
              }
            : {}),
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: query.limit + 1,
      });

      const page = rows.slice(0, query.limit);
      return {
        items: page.map(mapAuditLog),
        nextCursor: rows.length > query.limit ? (page[page.length - 1]?.id ?? null) : null,
      };
    });
  }
}
