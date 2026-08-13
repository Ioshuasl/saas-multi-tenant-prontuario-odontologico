import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import { encryptField } from '../../../../shared/crypto/envelope.js';
import { unwrapActiveDek } from '../../../../shared/database/tenant_dek.js';

export type CreateAlertInput = {
  id: string;
  medicalRecordId: string;
  severity: string;
  category: string;
  description: string;
  source: string;
};

export class CreateRepository {
  async executeInTx(
    tx: DbTransaction,
    ctx: RequestContext,
    input: CreateAlertInput,
  ): Promise<void> {
    const dek = await unwrapActiveDek(tx, ctx.tenantId);
    const ciphertext = encryptField(input.description, dek, {
      tenantId: ctx.tenantId,
      table: 'clinical_alert',
      column: 'description',
      rowId: input.id,
    });

    await tx.clinicalAlert.create({
      data: {
        id: input.id,
        tenantId: ctx.tenantId,
        medicalRecordId: input.medicalRecordId,
        severity: input.severity,
        category: input.category,
        description: ciphertext,
        source: input.source,
        active: true,
      },
    });
  }
}
