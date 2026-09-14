import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AuditAction, writeAuditLogSafe } from '../../../../shared/database/write_audit.js';
import { disableAllAutomations } from '../../../messaging/messaging_public.js';
import { READ_ONLY_SUBSCRIPTION_STATUSES } from '../../enum/subscription/subscription_status.enum.js';
import { SubscriptionNotFoundError } from '../../models/errors/subscription.errors.js';
import { UpdateStatusRepository } from '../../repositories/subscription/subscription_update_status.repository.js';
import type { OpsStatusBodySchema } from '../../schemas/subscription.schema.js';
import type { SubscriptionSummary } from '../../types/subscription.types.js';

export class UpdateStatusAction {
  constructor(private readonly updateStatus = new UpdateStatusRepository()) {}

  async execute(
    ctx: RequestContext,
    opsStatusSchema: OpsStatusBodySchema,
  ): Promise<SubscriptionSummary> {
    const updated = await this.updateStatus.execute(ctx, opsStatusSchema.status);
    if (!updated) throw new SubscriptionNotFoundError();

    if (READ_ONLY_SUBSCRIPTION_STATUSES.has(opsStatusSchema.status)) {
      await disableAllAutomations(ctx);
    }

    await writeAuditLogSafe({
      tenantId: ctx.tenantId,
      actorId: ctx.userId,
      actorType: 'USER',
      action: AuditAction.SUBSCRIPTION_STATUS_CHANGED,
      resourceType: 'subscription',
      resourceId: updated.id,
      metadata: {
        status: opsStatusSchema.status,
        reason: opsStatusSchema.reason ?? null,
        source: 'ops',
      },
    });

    return updated;
  }
}
