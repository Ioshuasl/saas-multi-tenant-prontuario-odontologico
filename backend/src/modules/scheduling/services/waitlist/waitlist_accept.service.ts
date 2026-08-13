import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AcceptAction } from '../../actions/waitlist/waitlist_accept.action.js';

export class AcceptService {
  constructor(private readonly acceptAction = new AcceptAction()) {}

  async executeFromToken(requestId: string, token: string) {
    return this.acceptAction.executeFromToken(requestId, token);
  }

  async executeFromOfferId(ctx: RequestContext, waitlistEntryId: string) {
    return this.acceptAction.executeFromOfferId(ctx, waitlistEntryId);
  }
}
