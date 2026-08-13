import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { ListRepository } from '../../repositories/waitlist/waitlist_list.repository.js';
import type { WaitlistListQuerySchema } from '../../schemas/waitlist.schema.js';

export class ListService {
  constructor(private readonly list = new ListRepository()) {}

  async execute(ctx: RequestContext, waitlistSchema?: WaitlistListQuerySchema) {
    return this.list.execute(ctx, waitlistSchema);
  }
}
