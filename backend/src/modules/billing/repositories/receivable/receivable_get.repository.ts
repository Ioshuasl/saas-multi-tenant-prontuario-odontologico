import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { ReceivableDetailDto } from '../../types/receivable/receivable_http.types.js';
import { toReceivableDetailDto } from './mappers/receivable.mapper.js';

const detailInclude = {
  lines: {
    orderBy: { number: 'asc' as const },
    include: {
      receivable: { select: { patientId: true, unitId: true } },
      payments: { include: { splits: true }, orderBy: { receivedAt: 'asc' as const } },
    },
  },
} as const;

export class GetRepository {
  async execute(ctx: RequestContext, receivableId: string): Promise<ReceivableDetailDto | null> {
    const row = await getTenantPrisma().runInTenantContext(ctx, (tx) =>
      tx.receivable.findFirst({
        where: { id: receivableId },
        include: detailInclude,
      }),
    );
    return row ? toReceivableDetailDto(row) : null;
  }
}
