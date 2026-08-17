import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { ApproveAction } from '../../actions/support_access/support_access_approve.action.js';
import type { SupportAccessRow } from '../../types/support_access/support_access.types.js';

export class ApproveService {
  constructor(private readonly approve = new ApproveAction()) {}

  async execute(ctx: RequestContext, grantId: string): Promise<SupportAccessRow> {
    return this.approve.execute(ctx, grantId);
  }
}
