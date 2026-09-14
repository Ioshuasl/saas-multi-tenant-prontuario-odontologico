import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { UpdateStatusAction } from '../../actions/subscription/subscription_update_status.action.js';
import type { OpsStatusBodySchema } from '../../schemas/subscription.schema.js';
import type { SubscriptionSummary } from '../../types/subscription.types.js';

export class UpdateStatusService {
  constructor(private readonly action = new UpdateStatusAction()) {}

  async execute(
    ctx: RequestContext,
    opsStatusSchema: OpsStatusBodySchema,
  ): Promise<SubscriptionSummary> {
    return this.action.execute(ctx, opsStatusSchema);
  }
}
