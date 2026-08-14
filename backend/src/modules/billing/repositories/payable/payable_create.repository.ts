import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import { civilDateUtc } from '../../helpers/civil_date.helper.js';
import type { PayableRecurrence } from '../../models/overdue.model.js';
import { toPayableDto } from './mappers/payable.mapper.js';

export class CreateRepository {
  async execute(
    ctx: RequestContext,
    persist: {
      unitId: string;
      categoryId: string;
      description: string;
      amountCents: bigint;
      dueDate: string;
      supplier: string | null;
      recurrence: PayableRecurrence | null;
    },
    today: string,
  ) {
    const row = await getTenantPrisma().runInTenantContext(ctx, (tx) =>
      tx.payable.create({
        data: {
          id: idGenerator.next(),
          tenantId: ctx.tenantId,
          unitId: persist.unitId,
          categoryId: persist.categoryId,
          description: persist.description,
          amountCents: persist.amountCents,
          dueDate: civilDateUtc(persist.dueDate),
          supplier: persist.supplier,
          recurrence: persist.recurrence === null ? undefined : persist.recurrence,
          status: 'OPEN',
        },
      }),
    );
    return toPayableDto(row, today);
  }
}
