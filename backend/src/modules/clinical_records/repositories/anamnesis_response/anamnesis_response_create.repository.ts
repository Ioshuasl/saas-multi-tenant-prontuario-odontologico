import type { Prisma } from '@prisma/client';
import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import { encryptField } from '../../../../shared/crypto/envelope.js';
import { unwrapActiveDek } from '../../../../shared/database/tenant_dek.js';
import type { AnamnesisAnswers } from '../../types/anamnesis/anamnesis_question.types.js';

export type CreateResponseInput = {
  id: string;
  medicalRecordId: string;
  formId: string;
  formVersion: number;
  answers: AnamnesisAnswers;
  answeredBy: string;
  signature: Record<string, unknown> | null;
};

export class CreateRepository {
  async executeInTx(
    tx: DbTransaction,
    ctx: RequestContext,
    input: CreateResponseInput,
  ): Promise<void> {
    const dek = await unwrapActiveDek(tx, ctx.tenantId);
    const ciphertext = encryptField(JSON.stringify(input.answers), dek, {
      tenantId: ctx.tenantId,
      table: 'anamnesis_response',
      column: 'answers',
      rowId: input.id,
    });

    await tx.anamnesisResponse.create({
      data: {
        id: input.id,
        tenantId: ctx.tenantId,
        medicalRecordId: input.medicalRecordId,
        formId: input.formId,
        formVersion: input.formVersion,
        answers: ciphertext,
        answeredBy: input.answeredBy,
        signature: (input.signature ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  }
}
