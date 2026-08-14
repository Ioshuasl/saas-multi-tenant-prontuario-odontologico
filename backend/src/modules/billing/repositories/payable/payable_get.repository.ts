import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { PayableDto } from '../../types/payable/payable.types.js';
import { toPayableDto } from './mappers/payable.mapper.js';

export class GetRepository {
  async executeInTx(tx: DbTransaction, payableId: string, today: string): Promise<PayableDto | null> {
    const row = await tx.payable.findFirst({ where: { id: payableId } });
    return row ? toPayableDto(row, today) : null;
  }

  async execute(ctx: RequestContext, payableId: string, today: string): Promise<PayableDto | null> {
    return getTenantPrisma().runInTenantContext(ctx, (inner) => this.executeInTx(inner, payableId, today));
  }
}

export class FindByPayIdempotencyRepository {
  async executeInTx(tx: DbTransaction, payIdempotencyKey: string, today: string) {
    const row = await tx.payable.findFirst({ where: { payIdempotencyKey } });
    return row ? toPayableDto(row, today) : null;
  }

  async execute(ctx: RequestContext, payIdempotencyKey: string, today: string) {
    return getTenantPrisma().runInTenantContext(ctx, (inner) =>
      this.executeInTx(inner, payIdempotencyKey, today),
    );
  }
}

export class GetRawRepository {
  async executeInTx(tx: DbTransaction, payableId: string) {
    return tx.payable.findFirst({ where: { id: payableId } });
  }

  execute(ctx: RequestContext, payableId: string) {
    return getTenantPrisma().runInTenantContext(ctx, (inner) => this.executeInTx(inner, payableId));
  }
}
