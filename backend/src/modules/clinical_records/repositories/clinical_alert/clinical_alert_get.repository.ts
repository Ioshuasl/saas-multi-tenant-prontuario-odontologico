import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { decryptField } from '../../../../shared/crypto/envelope.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { unwrapActiveDek } from '../../../../shared/database/tenant_dek.js';
import type { ClinicalAlertSummary } from '../../types/medical_record/medical_record_get.types.js';
import { mapAlertSummary } from '../medical_record/mappers/medical_record.mapper.js';

export class GetRepository {
  async execute(
    ctx: RequestContext,
    patientId: string,
    alertId: string,
  ): Promise<ClinicalAlertSummary | null> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const record = await tx.medicalRecord.findUnique({
        where: { tenantId_patientId: { tenantId: ctx.tenantId, patientId } },
        select: { id: true },
      });
      if (!record) return null;

      const row = await tx.clinicalAlert.findFirst({
        where: { tenantId: ctx.tenantId, medicalRecordId: record.id, id: alertId },
      });
      if (!row) return null;

      const dek = await unwrapActiveDek(tx, ctx.tenantId);
      return mapAlertSummary({
        id: row.id,
        severity: row.severity,
        category: row.category,
        description: decryptField(row.description, dek, {
          tenantId: ctx.tenantId,
          table: 'clinical_alert',
          column: 'description',
          rowId: row.id,
        }),
        source: row.source,
        active: row.active,
      });
    });
  }
}
