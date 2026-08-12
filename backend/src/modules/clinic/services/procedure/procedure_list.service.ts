import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { ListProceduresRepository } from '../../repositories/procedure/procedure.repository.js';
import type { ProcedureSummary } from '../../types/clinic.types.js';

export class ListService {
  constructor(private readonly list = new ListProceduresRepository()) {}

  async execute(
    ctx: RequestContext,
    filter?: { search?: string; specialty?: string; active?: boolean },
  ): Promise<ProcedureSummary[]> {
    return this.list.execute(ctx, filter);
  }
}
