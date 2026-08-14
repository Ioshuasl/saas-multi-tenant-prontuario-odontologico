import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { CashSessionDto } from '../../types/cash_session/cash_session.types.js';
import { toCashSessionDto } from './mappers/cash_session.mapper.js';

const sessionInclude = {
  movements: { orderBy: { createdAt: 'asc' as const } },
} as const;

export class GetRepository {
  async executeInTx(tx: DbTransaction, sessionId: string): Promise<CashSessionDto | null> {
    const row = await tx.cashSession.findFirst({
      where: { id: sessionId },
      include: sessionInclude,
    });
    return row ? toCashSessionDto(row) : null;
  }

  async execute(ctx: RequestContext, sessionId: string): Promise<CashSessionDto | null> {
    return getTenantPrisma().runInTenantContext(ctx, (tx) => this.executeInTx(tx, sessionId));
  }
}

export class GetCurrentRepository {
  async execute(ctx: RequestContext, unitId: string): Promise<CashSessionDto | null> {
    const row = await getTenantPrisma().runInTenantContext(ctx, (tx) =>
      tx.cashSession.findFirst({
        where: { unitId, openedBy: ctx.userId, status: 'OPEN' },
        include: sessionInclude,
      }),
    );
    return row ? toCashSessionDto(row) : null;
  }
}

export class FindByIdempotencyRepository {
  async executeInTx(tx: DbTransaction, idempotencyKey: string): Promise<CashSessionDto | null> {
    const row = await tx.cashSession.findFirst({
      where: { idempotencyKey },
      include: sessionInclude,
    });
    return row ? toCashSessionDto(row) : null;
  }

  async execute(ctx: RequestContext, idempotencyKey: string): Promise<CashSessionDto | null> {
    return getTenantPrisma().runInTenantContext(ctx, (tx) => this.executeInTx(tx, idempotencyKey));
  }
}

export class FindByCloseIdempotencyRepository {
  async executeInTx(tx: DbTransaction, closeIdempotencyKey: string): Promise<CashSessionDto | null> {
    const row = await tx.cashSession.findFirst({
      where: { closeIdempotencyKey },
      include: sessionInclude,
    });
    return row ? toCashSessionDto(row) : null;
  }

  async execute(ctx: RequestContext, closeIdempotencyKey: string): Promise<CashSessionDto | null> {
    return getTenantPrisma().runInTenantContext(ctx, (tx) =>
      this.executeInTx(tx, closeIdempotencyKey),
    );
  }
}

export class GetUnitRepository {
  async executeInTx(tx: DbTransaction, unitId: string): Promise<{ id: string } | null> {
    return tx.unit.findFirst({
      where: { id: unitId },
      select: { id: true },
    });
  }

  execute(ctx: RequestContext, unitId: string) {
    return getTenantPrisma().runInTenantContext(ctx, (inner) => this.executeInTx(inner, unitId));
  }
}
