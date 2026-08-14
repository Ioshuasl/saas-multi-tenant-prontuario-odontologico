import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { civilDateUtc } from '../../helpers/civil_date.helper.js';
import type { PayableListQuerySchema } from '../../schemas/billing.schema.js';
import type { PayableListResult } from '../../types/payable/payable.types.js';
import { toPayableDto } from './mappers/payable.mapper.js';

export class ListRepository {
  async execute(
    ctx: RequestContext,
    query: PayableListQuerySchema,
    today: string,
  ): Promise<PayableListResult> {
    const limit = query.limit ?? 20;
    const dueFrom = query.dueFrom ? civilDateUtc(query.dueFrom) : undefined;
    const dueTo = query.dueTo ? civilDateUtc(query.dueTo) : undefined;
    const todayDate = civilDateUtc(today);

    const rows = await getTenantPrisma().runInTenantContext(ctx, (tx) =>
      tx.payable.findMany({
        where: {
          ...(query.status === 'OVERDUE'
            ? {
                OR: [{ status: 'OVERDUE' }, { status: 'OPEN', dueDate: { lt: todayDate } }],
              }
            : query.status === 'OPEN'
              ? { status: 'OPEN', dueDate: { gte: todayDate } }
              : query.status
                ? { status: query.status }
                : {}),
          ...(dueFrom || dueTo
            ? {
                dueDate: {
                  ...(dueFrom ? { gte: dueFrom } : {}),
                  ...(dueTo ? { lte: dueTo } : {}),
                },
              }
            : {}),
          ...(query.cursor ? { id: { lt: query.cursor } } : {}),
        },
        orderBy: [{ dueDate: 'asc' }, { id: 'asc' }],
        take: limit + 1,
      }),
    );

    const page = rows.slice(0, limit);
    const next = rows.length > limit ? page[page.length - 1]?.id ?? null : null;
    return { items: page.map((row) => toPayableDto(row, today)), nextCursor: next };
  }
}
