import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { UnitOfWork } from '../../../../shared/database/unit_of_work.js';
import { AuditAction, writeAuditLogSafe } from '../../../../shared/database/write_audit.js';
import { softDeleteNonClinicalAttachments } from '../../../clinical_records/clinical_records_public.js';
import { anonymizePatient, revokeMarketingConsent } from '../../../patients/patients_public.js';
import { GetRepository } from '../../repositories/data_subject_request/data_subject_request_get.repository.js';
import { UpdateRepository } from '../../repositories/data_subject_request/data_subject_request_update.repository.js';

const DELETION_RESOLUTION =
  'Identificadores anonimizados. Prontuário retido por obrigação legal de guarda.';

export class AnonymizeAction {
  constructor(
    private readonly uow = new UnitOfWork(),
    private readonly get = new GetRepository(),
    private readonly update = new UpdateRepository(),
  ) {}

  async execute(ctx: RequestContext, dsrId: string): Promise<void> {
    const dsr = await this.get.execute(ctx, dsrId);
    if (!dsr || dsr.type !== 'DELETION') return;
    if (dsr.status === 'COMPLETED' || dsr.status === 'REJECTED') return;

    const completed = await this.uow.run(ctx, async ({ tx }) => {
      const result = await anonymizePatient(ctx, dsr.patientId, tx);
      if (!result.found) return false;
      if (result.changed) {
        await revokeMarketingConsent(ctx, dsr.patientId, tx);
        await softDeleteNonClinicalAttachments(ctx, dsr.patientId, tx);
      }
      await this.update.executeInTx(tx, ctx, dsr.id, {
        status: 'COMPLETED',
        resolution: DELETION_RESOLUTION,
        completedAt: new Date(),
        handledBy: null,
      });
      return true;
    });

    if (!completed) return;

    await writeAuditLogSafe({
      tenantId: ctx.tenantId,
      actorId: ctx.userId,
      action: AuditAction.DSR_COMPLETED,
      resourceType: 'data_subject_request',
      resourceId: dsr.id,
      patientId: dsr.patientId,
      metadata: { type: dsr.type },
    });
  }
}
