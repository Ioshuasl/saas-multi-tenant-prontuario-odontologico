import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { DsrStatus } from '../../enum/data_subject_request/data_subject_request_status.enum.js';
import type { DataSubjectRequestRow } from '../../types/data_subject_request/data_subject_request.types.js';
import { mapDataSubjectRequest } from './mappers/data_subject_request.mapper.js';

type UpdateInput = {
  status?: DsrStatus;
  resolution?: string | null;
  completedAt?: Date | null;
  handledBy?: string | null;
  exportKey?: string | null;
};

export class UpdateRepository {
  async execute(
    ctx: RequestContext,
    dsrId: string,
    input: UpdateInput,
  ): Promise<DataSubjectRequestRow | null> {
    return getTenantPrisma().runInTenantContext(ctx, (tx) => this.executeInTx(tx, ctx, dsrId, input));
  }

  async executeInTx(
    tx: DbTransaction,
    ctx: RequestContext,
    dsrId: string,
    input: UpdateInput,
  ): Promise<DataSubjectRequestRow | null> {
    const updated = await tx.dataSubjectRequest.updateMany({
      where: { id: dsrId, tenantId: ctx.tenantId },
      data: {
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.resolution !== undefined ? { resolution: input.resolution } : {}),
        ...(input.completedAt !== undefined ? { completedAt: input.completedAt } : {}),
        ...(input.handledBy !== undefined ? { handledBy: input.handledBy } : {}),
        ...(input.exportKey !== undefined ? { exportKey: input.exportKey } : {}),
      },
    });
    if (updated.count === 0) return null;
    const row = await tx.dataSubjectRequest.findFirst({
      where: { id: dsrId, tenantId: ctx.tenantId },
    });
    return row ? mapDataSubjectRequest(row) : null;
  }
}
