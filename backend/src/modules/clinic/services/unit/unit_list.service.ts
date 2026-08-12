import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { ListUnitsRepository } from '../../repositories/unit/unit.repository.js';
import type { UnitSummary } from '../../types/clinic.types.js';

export class ListService {
  constructor(private readonly list = new ListUnitsRepository()) {}

  async execute(ctx: RequestContext): Promise<UnitSummary[]> {
    return this.list.execute(ctx);
  }
}
