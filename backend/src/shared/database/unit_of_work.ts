import type { DomainEvent } from '../domain/domain_event.js';
import type { RequestContext } from '../domain/request_context.js';
import type { DbTransaction } from './db_transaction.js';
import { appendOutboxEvents } from './outbox.js';
import { getTenantPrisma, type TenantPrisma } from './tenant_prisma.js';

export type UnitOfWorkScope = {
  tx: DbTransaction;
  publish: (events: readonly DomainEvent[]) => void;
};

/**
 * Transação de tenant + outbox na mesma UoW (ADR-0006).
 * Repositórios que abrem transação própria não devem ser chamados de dentro de `run`.
 */
export class UnitOfWork {
  constructor(private readonly db: TenantPrisma = getTenantPrisma()) {}

  async run<T>(ctx: RequestContext, fn: (scope: UnitOfWorkScope) => Promise<T>): Promise<T> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const pending: DomainEvent[] = [];
      const result = await fn({
        tx,
        publish: (events) => {
          pending.push(...events);
        },
      });
      if (pending.length > 0) {
        await appendOutboxEvents(tx, ctx.tenantId, pending);
      }
      return result;
    });
  }
}
