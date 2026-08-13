import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { decryptField } from '../../../../shared/crypto/envelope.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { unwrapActiveDek } from '../../../../shared/database/tenant_dek.js';
import type { ClinicalAlertSummary } from '../../types/medical_record/medical_record_get.types.js';
import { mapAlertSummary } from '../medical_record/mappers/medical_record.mapper.js';

export class ListCriticalRepository {
  async execute(ctx: RequestContext, patientId: string): Promise<ClinicalAlertSummary[]> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const record = await tx.medicalRecord.findUnique({
        where: { tenantId_patientId: { tenantId: ctx.tenantId, patientId } },
        select: { id: true },
      });
      if (!record) return [];

      const rows = await tx.clinicalAlert.findMany({
        where: {
          tenantId: ctx.tenantId,
          medicalRecordId: record.id,
          severity: 'CRITICAL',
          active: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      if (rows.length === 0) return [];

      const dek = await unwrapActiveDek(tx, ctx.tenantId);
      return rows.map((row) =>
        mapAlertSummary({
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
        }),
      );
    });
  }
}
