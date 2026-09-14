import type { DbTransaction } from '../../../../shared/database/db_transaction.js';

export type CreateSubscriptionInput = {
  id: string;
  tenantId: string;
  planId: string;
  status: string;
  trialEndsAt: Date | null;
};

export class CreateRepository {
  async execute(tx: DbTransaction, input: CreateSubscriptionInput): Promise<void> {
    await tx.subscription.create({
      data: {
        id: input.id,
        tenantId: input.tenantId,
        planId: input.planId,
        status: input.status,
        trialEndsAt: input.trialEndsAt,
      },
    });
  }
}
