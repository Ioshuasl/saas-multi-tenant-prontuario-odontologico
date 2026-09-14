import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AuditAction, writeAuditLogSafe } from '../../../../shared/database/write_audit.js';
import { canTransitionDsrStatus } from '../../models/data_subject_request/data_subject_request.guard.js';
import {
  DataSubjectRequestNotFoundError,
  DataSubjectRequestStatusInvalidError,
} from '../../models/errors/data_subject_request.errors.js';
import { GetRepository } from '../../repositories/data_subject_request/data_subject_request_get.repository.js';
import { UpdateRepository } from '../../repositories/data_subject_request/data_subject_request_update.repository.js';
import { toDataSubjectRequestView } from '../../repositories/data_subject_request/mappers/data_subject_request.mapper.js';
import type { DataSubjectRequestUpdateSchema } from '../../schemas/data_subject_request.schema.js';
import type { DataSubjectRequestView } from '../../types/data_subject_request/data_subject_request.types.js';

export class UpdateService {
  constructor(
    private readonly get = new GetRepository(),
    private readonly update = new UpdateRepository(),
  ) {}

  async execute(
    ctx: RequestContext,
    dsrId: string,
    dataSubjectRequestSchema: DataSubjectRequestUpdateSchema,
  ): Promise<DataSubjectRequestView> {
    const current = await this.get.execute(ctx, dsrId);
    if (!current) throw new DataSubjectRequestNotFoundError();

    if (dataSubjectRequestSchema.status) {
      if (!canTransitionDsrStatus(current.status, dataSubjectRequestSchema.status)) {
        throw new DataSubjectRequestStatusInvalidError();
      }
    }

    const terminal =
      dataSubjectRequestSchema.status === 'COMPLETED' ||
      dataSubjectRequestSchema.status === 'REJECTED';

    const updated = await this.update.execute(ctx, dsrId, {
      status: dataSubjectRequestSchema.status,
      resolution: dataSubjectRequestSchema.resolution,
      completedAt: terminal ? new Date() : undefined,
      handledBy: terminal || dataSubjectRequestSchema.status ? ctx.userId : undefined,
    });
    if (!updated) throw new DataSubjectRequestNotFoundError();

    if (dataSubjectRequestSchema.status === 'COMPLETED') {
      await writeAuditLogSafe({
        tenantId: ctx.tenantId,
        actorId: ctx.userId,
        action: AuditAction.DSR_COMPLETED,
        resourceType: 'data_subject_request',
        resourceId: updated.id,
        patientId: updated.patientId,
        metadata: { type: updated.type },
      });
    }
    if (dataSubjectRequestSchema.status === 'REJECTED') {
      await writeAuditLogSafe({
        tenantId: ctx.tenantId,
        actorId: ctx.userId,
        action: AuditAction.DSR_REJECTED,
        resourceType: 'data_subject_request',
        resourceId: updated.id,
        patientId: updated.patientId,
        metadata: { type: updated.type },
      });
    }

    return toDataSubjectRequestView(updated);
  }
}
