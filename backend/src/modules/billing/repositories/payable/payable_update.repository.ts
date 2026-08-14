import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { civilDateUtc } from '../../helpers/civil_date.helper.js';
import type { PayableRecurrence } from '../../models/overdue.model.js';
import { toPayableDto } from './mappers/payable.mapper.js';

export class UpdateRepository {
  async execute(
    ctx: RequestContext,
    payableId: string,
    persist: {
      categoryId?: string;
      description?: string;
      amountCents?: bigint;
      dueDate?: string;
      supplier?: string | null;
      recurrence?: PayableRecurrence | null;
    },
    today: string,
  ) {
    const row = await getTenantPrisma().runInTenantContext(ctx, (tx) =>
      tx.payable.update({
        where: { id: payableId },
        data: {
          ...(persist.categoryId ? { categoryId: persist.categoryId } : {}),
          ...(persist.description ? { description: persist.description } : {}),
          ...(persist.amountCents !== undefined ? { amountCents: persist.amountCents } : {}),
          ...(persist.dueDate ? { dueDate: civilDateUtc(persist.dueDate) } : {}),
          ...(persist.supplier !== undefined ? { supplier: persist.supplier } : {}),
          ...(persist.recurrence !== undefined
            ? { recurrence: persist.recurrence === null ? undefined : persist.recurrence }
            : {}),
        },
      }),
    );
    return toPayableDto(row, today);
  }
}
