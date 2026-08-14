import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { GetCurrentRepository } from '../../repositories/cash_session/cash_session_get.repository.js';

export class GetCurrentService {
  constructor(private readonly getCurrent = new GetCurrentRepository()) {}

  execute(ctx: RequestContext, unitId: string) {
    return this.getCurrent.execute(ctx, unitId);
  }
}
