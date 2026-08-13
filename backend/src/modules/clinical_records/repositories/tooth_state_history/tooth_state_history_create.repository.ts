import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import type { ToothStateHistorySource } from '../../enum/tooth_state/tooth_state_history_source.enum.js';

export type CreateHistoryInput = {
  toothStateId: string;
  fromCondition: string | null;
  toCondition: string;
  source: ToothStateHistorySource;
  sourceId?: string | null;
  actorId: string;
  createdAt?: Date;
};

export class CreateRepository {
  async executeInTx(
    tx: DbTransaction,
    ctx: RequestContext,
    input: CreateHistoryInput,
  ): Promise<string> {
    const id = idGenerator.next();
    await tx.toothStateHistory.create({
      data: {
        id,
        tenantId: ctx.tenantId,
        toothStateId: input.toothStateId,
        fromCondition: input.fromCondition,
        toCondition: input.toCondition,
        source: input.source,
        sourceId: input.sourceId ?? null,
        actorId: input.actorId,
        ...(input.createdAt ? { createdAt: input.createdAt } : {}),
      },
    });
    return id;
  }
}
