import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { UnitOfWork } from '../../../../shared/database/unit_of_work.js';
import { AuditAction, writeAuditLogSafe } from '../../../../shared/database/write_audit.js';
import { UpdateStatusRepository } from '../../repositories/tenant_export/tenant_export_update_status.repository.js';

export class CompleteAction {
  constructor(
    private readonly uow = new UnitOfWork(),
    private readonly updateStatus = new UpdateStatusRepository(),
  ) {}

  async execute(ctx: RequestContext, exportId: string, storageKey: string): Promise<void> {
    await this.uow.run(ctx, async ({ tx, publish }) => {
      await this.updateStatus.executeInTx(tx, ctx, exportId, {
        status: 'READY',
        storageKey,
        error: null,
      });
      publish([
        {
          name: 'platform.data_export_completed',
          payload: { exportId, requestId: ctx.requestId },
        },
      ]);
    });

    await writeAuditLogSafe({
      tenantId: ctx.tenantId,
      actorId: ctx.userId,
      action: AuditAction.EXPORT_COMPLETED,
      resourceType: 'tenant_export',
      resourceId: exportId,
    });
  }
}
