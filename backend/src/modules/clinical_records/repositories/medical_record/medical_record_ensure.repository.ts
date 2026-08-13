import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import { MedicalRecord } from '../../models/medical_record.model.js';

export type EnsureRecordResult = {
  medicalRecordId: string;
  openedAt: Date;
  created: boolean;
};

export class EnsureRepository {
  async executeInTx(
    tx: DbTransaction,
    ctx: RequestContext,
    patientId: string,
  ): Promise<EnsureRecordResult> {
    const existing = await tx.medicalRecord.findUnique({
      where: { tenantId_patientId: { tenantId: ctx.tenantId, patientId } },
      select: { id: true, openedAt: true },
    });
    if (existing) {
      return { medicalRecordId: existing.id, openedAt: existing.openedAt, created: false };
    }

    const record = MedicalRecord.open({
      id: idGenerator.next(),
      tenantId: ctx.tenantId,
      patientId,
    });

    try {
      await tx.medicalRecord.create({
        data: {
          id: record.id,
          tenantId: record.tenantId,
          patientId: record.patientId,
          openedAt: record.openedAt,
        },
      });
      return { medicalRecordId: record.id, openedAt: record.openedAt, created: true };
    } catch {
      const raced = await tx.medicalRecord.findUnique({
        where: { tenantId_patientId: { tenantId: ctx.tenantId, patientId } },
        select: { id: true, openedAt: true },
      });
      if (!raced) throw new Error('Falha ao garantir medical_record.');
      return { medicalRecordId: raced.id, openedAt: raced.openedAt, created: false };
    }
  }

  async execute(ctx: RequestContext, patientId: string): Promise<EnsureRecordResult> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, (tx) => this.executeInTx(tx, ctx, patientId));
  }
}
