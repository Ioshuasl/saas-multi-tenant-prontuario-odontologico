import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { MarkOverdueAction } from '../../actions/installment/installment_mark_overdue.action.js';

export class MarkOverdueService {
  constructor(private readonly mark = new MarkOverdueAction()) {}

  execute(ctx: RequestContext) {
    return this.mark.execute(ctx);
  }
}
