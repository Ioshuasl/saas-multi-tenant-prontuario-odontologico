import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { Dentition } from '../../enum/tooth_state/dentition.enum.js';

export type ToothStateKeyRow = {
  id: string;
  face: string | null;
  condition: string;
  notes: string | null;
  recordedBy: string;
  recordedAt: Date;
};

export class ListByToothRepository {
  async executeInTx(
    tx: DbTransaction,
    ctx: RequestContext,
    input: { medicalRecordId: string; dentition: Dentition; toothCode: string },
  ): Promise<ToothStateKeyRow[]> {
    const rows = await tx.toothState.findMany({
      where: {
        tenantId: ctx.tenantId,
        medicalRecordId: input.medicalRecordId,
        dentition: input.dentition,
        toothCode: input.toothCode,
      },
    });
    return rows.map((row) => ({
      id: row.id,
      face: row.face,
      condition: row.condition,
      notes: row.notes,
      recordedBy: row.recordedBy,
      recordedAt: row.recordedAt,
    }));
  }

  async execute(
    ctx: RequestContext,
    input: { medicalRecordId: string; dentition: Dentition; toothCode: string },
  ): Promise<ToothStateKeyRow[]> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, (tx) => this.executeInTx(tx, ctx, input));
  }
}
