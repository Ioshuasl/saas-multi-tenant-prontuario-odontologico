import type { Prisma } from '@prisma/client';
import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import {
  ANAMNESIS_GERAL_NAME,
  ANAMNESIS_GERAL_V1_QUESTIONS,
} from '../../helpers/anamnesis_form_seed.helper.js';

export class SeedRepository {
  async executeInTx(
    tx: DbTransaction,
    input: { tenantId: string; idNext: () => string },
  ): Promise<void> {
    const existing = await tx.anamnesisForm.findFirst({
      where: { tenantId: input.tenantId, name: ANAMNESIS_GERAL_NAME },
    });
    if (existing) return;

    await tx.anamnesisForm.create({
      data: {
        id: input.idNext(),
        tenantId: input.tenantId,
        name: ANAMNESIS_GERAL_NAME,
        version: 1,
        questions: ANAMNESIS_GERAL_V1_QUESTIONS as Prisma.InputJsonValue,
        active: true,
      },
    });
  }
}
