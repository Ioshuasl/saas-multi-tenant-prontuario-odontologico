import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { decryptField } from '../../../../shared/crypto/envelope.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { unwrapActiveDek } from '../../../../shared/database/tenant_dek.js';
import type { MedicalRecordHeader } from '../../types/medical_record/medical_record_get.types.js';
import { isAnamnesisStale, mapAlertSummary } from './mappers/medical_record.mapper.js';

export class GetRepository {
  async execute(ctx: RequestContext, patientId: string): Promise<MedicalRecordHeader | null> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const record = await tx.medicalRecord.findUnique({
        where: { tenantId_patientId: { tenantId: ctx.tenantId, patientId } },
        select: { id: true, openedAt: true },
      });
      if (!record) return null;

      const lastAnamnesis = await tx.anamnesisResponse.findFirst({
        where: { tenantId: ctx.tenantId, medicalRecordId: record.id },
        orderBy: { answeredAt: 'desc' },
        select: { answeredAt: true },
      });

      const alertRows = await tx.clinicalAlert.findMany({
        where: { tenantId: ctx.tenantId, medicalRecordId: record.id, active: true },
        orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
      });

      let dek: Buffer | null = null;
      const alerts = [];
      for (const row of alertRows) {
        if (!dek) dek = await unwrapActiveDek(tx, ctx.tenantId);
        const description = decryptField(row.description, dek, {
          tenantId: ctx.tenantId,
          table: 'clinical_alert',
          column: 'description',
          rowId: row.id,
        });
        alerts.push(
          mapAlertSummary({
            id: row.id,
            severity: row.severity,
            category: row.category,
            description,
            source: row.source,
            active: row.active,
          }),
        );
      }

      alerts.sort((a, b) => severityRank(a.severity) - severityRank(b.severity));

      return {
        patientId,
        medicalRecordId: record.id,
        openedAt: record.openedAt.toISOString(),
        anamnesisStale: isAnamnesisStale(lastAnamnesis?.answeredAt ?? null),
        lastAnamnesisAt: lastAnamnesis?.answeredAt.toISOString() ?? null,
        alerts,
      };
    });
  }
}

function severityRank(severity: string): number {
  if (severity === 'CRITICAL') return 0;
  if (severity === 'WARNING') return 1;
  return 2;
}
