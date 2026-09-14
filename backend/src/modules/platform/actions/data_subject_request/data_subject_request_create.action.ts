import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { UnitOfWork } from '../../../../shared/database/unit_of_work.js';
import { AuditAction, writeAuditLogSafe } from '../../../../shared/database/write_audit.js';
import { getPatientById, revokeMarketingConsent } from '../../../patients/patients_public.js';
import { DSR_PACKAGE_TYPES } from '../../enum/data_subject_request/data_subject_request_type.enum.js';
import { computeDsrDueAt } from '../../helpers/dsr_due.helper.js';
import {
  DataSubjectRequestPatientNotFoundError,
} from '../../models/errors/data_subject_request.errors.js';
import { CreateRepository } from '../../repositories/data_subject_request/data_subject_request_create.repository.js';
import type { DataSubjectRequestCreateSchema } from '../../schemas/data_subject_request.schema.js';
import type { DataSubjectRequestRow } from '../../types/data_subject_request/data_subject_request.types.js';

const REVOKE_RESOLUTION =
  'Consentimento de marketing revogado. Comunicação transacional permanece.';

export class CreateAction {
  constructor(
    private readonly uow = new UnitOfWork(),
    private readonly create = new CreateRepository(),
  ) {}

  async execute(
    ctx: RequestContext,
    dataSubjectRequestSchema: DataSubjectRequestCreateSchema,
  ): Promise<DataSubjectRequestRow> {
    const patient = await getPatientById(ctx, dataSubjectRequestSchema.patientId);
    if (!patient) throw new DataSubjectRequestPatientNotFoundError();

    const requestedAt = new Date();
    const revoke = dataSubjectRequestSchema.type === 'REVOKE_CONSENT';
    const deletion = dataSubjectRequestSchema.type === 'DELETION';
    const row = await this.uow.run(ctx, async ({ tx, publish }) => {
      const created = await this.create.executeInTx(tx, ctx, {
        patientId: dataSubjectRequestSchema.patientId,
        type: dataSubjectRequestSchema.type,
        dueAt: computeDsrDueAt(requestedAt),
        status: revoke ? 'COMPLETED' : deletion ? 'IN_PROGRESS' : 'RECEIVED',
        resolution: revoke
          ? REVOKE_RESOLUTION
          : (dataSubjectRequestSchema.notes ?? null),
        completedAt: revoke ? requestedAt : null,
        handledBy: revoke ? ctx.userId : null,
      });

      if (revoke) {
        await revokeMarketingConsent(ctx, dataSubjectRequestSchema.patientId, tx);
      }

      if (DSR_PACKAGE_TYPES.includes(dataSubjectRequestSchema.type)) {
        publish([
          {
            name: 'platform.patient_package_requested',
            payload: { dsrId: created.id, requestId: ctx.requestId },
          },
        ]);
      }

      if (deletion) {
        publish([
          {
            name: 'platform.patient_anonymize_requested',
            payload: { dsrId: created.id, requestId: ctx.requestId },
          },
        ]);
      }

      return created;
    });

    await writeAuditLogSafe({
      tenantId: ctx.tenantId,
      actorId: ctx.userId,
      action: AuditAction.DSR_CREATED,
      resourceType: 'data_subject_request',
      resourceId: row.id,
      patientId: row.patientId,
      metadata: { type: row.type },
    });

    if (revoke) {
      await writeAuditLogSafe({
        tenantId: ctx.tenantId,
        actorId: ctx.userId,
        action: AuditAction.DSR_COMPLETED,
        resourceType: 'data_subject_request',
        resourceId: row.id,
        patientId: row.patientId,
        metadata: { type: row.type },
      });
    }

    return row;
  }
}
