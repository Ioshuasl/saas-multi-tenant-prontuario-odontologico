import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { decryptField } from '../../../../shared/crypto/envelope.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { unwrapActiveDek } from '../../../../shared/database/tenant_dek.js';
import type { AnamnesisResponseSummary } from '../../types/anamnesis/anamnesis_list.types.js';
import { mapAnamnesisResponse } from './mappers/anamnesis_response.mapper.js';

export class ListRepository {
  async execute(ctx: RequestContext, patientId: string): Promise<AnamnesisResponseSummary[]> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const record = await tx.medicalRecord.findUnique({
        where: { tenantId_patientId: { tenantId: ctx.tenantId, patientId } },
        select: { id: true },
      });
      if (!record) return [];

      const rows = await tx.anamnesisResponse.findMany({
        where: { tenantId: ctx.tenantId, medicalRecordId: record.id },
        include: { form: { select: { name: true, questions: true } } },
        orderBy: { answeredAt: 'desc' },
      });
      if (rows.length === 0) return [];

      const dek = await unwrapActiveDek(tx, ctx.tenantId);
      return rows.map((row) => {
        const plaintext = decryptField(row.answers, dek, {
          tenantId: ctx.tenantId,
          table: 'anamnesis_response',
          column: 'answers',
          rowId: row.id,
        });
        return mapAnamnesisResponse({
          id: row.id,
          formId: row.formId,
          formVersion: row.formVersion,
          answeredBy: row.answeredBy,
          answeredAt: row.answeredAt,
          signature: row.signature,
          answersJson: plaintext,
          formName: row.form.name,
          questions: row.form.questions,
        });
      });
    });
  }
}
