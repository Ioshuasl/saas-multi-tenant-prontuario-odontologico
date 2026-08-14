import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { ReceivableListQuerySchema } from '../../schemas/billing.schema.js';
import type { ReceivableListResult } from '../../types/receivable/receivable_http.types.js';
import { toReceivableListItemDto } from './mappers/receivable.mapper.js';

export class ListRepository {
  async execute(ctx: RequestContext, query: ReceivableListQuerySchema): Promise<ReceivableListResult> {
    const limit = query.limit ?? 20;
    const from = query.from ? new Date(`${query.from}T00:00:00.000Z`) : undefined;
    const to = query.to ? new Date(`${query.to}T23:59:59.999Z`) : undefined;

    const rows = await getTenantPrisma().runInTenantContext(ctx, (tx) =>
      tx.receivable.findMany({
        where: {
          ...(query.patientId ? { patientId: query.patientId } : {}),
          ...(query.status ? { status: query.status } : {}),
          ...(from || to
            ? {
                createdAt: {
                  ...(from ? { gte: from } : {}),
                  ...(to ? { lte: to } : {}),
                },
              }
            : {}),
          ...(query.cursor ? { id: { lt: query.cursor } } : {}),
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: limit + 1,
      }),
    );

    const page = rows.slice(0, limit);
    const next = rows.length > limit ? page[page.length - 1]?.id ?? null : null;
    return { items: page.map(toReceivableListItemDto), nextCursor: next };
  }
}
