import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { decryptField } from '../../../../shared/crypto/envelope.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { unwrapActiveDek } from '../../../../shared/database/tenant_dek.js';
import type { ClinicalAlertSummary } from '../../types/medical_record/medical_record_get.types.js';
import type { ClinicalAlertListQuerySchema } from '../../schemas/clinical_alert.schema.js';
import { mapAlertSummary } from '../medical_record/mappers/medical_record.mapper.js';

function severityRank(severity: string): number {
  if (severity === 'CRITICAL') return 0;
  if (severity === 'WARNING') return 1;
  return 2;
}

export class ListRepository {
  async execute(
    ctx: RequestContext,
    patientId: string,
    query: ClinicalAlertListQuerySchema,
  ): Promise<ClinicalAlertSummary[]> {
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
          ...(query.severity ? { severity: query.severity } : {}),
          ...(query.category ? { category: query.category } : {}),
          ...(query.active !== undefined ? { active: query.active } : {}),
        },
        orderBy: { createdAt: 'desc' },
      });
      if (rows.length === 0) return [];

      const dek = await unwrapActiveDek(tx, ctx.tenantId);
      const alerts = rows.map((row) =>
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
      alerts.sort((a, b) => severityRank(a.severity) - severityRank(b.severity));
      return alerts;
    });
  }
}
