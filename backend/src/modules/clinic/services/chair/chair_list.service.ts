import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';
import { ListChairsRepository } from '../../repositories/chair/chair.repository.js';
import { GetUnitRepository } from '../../repositories/unit/unit.repository.js';
import type { ChairSummary } from '../../types/clinic.types.js';

export class ListService {
  constructor(
    private readonly getUnit = new GetUnitRepository(),
    private readonly list = new ListChairsRepository(),
  ) {}

  async execute(ctx: RequestContext, unitId: string): Promise<ChairSummary[]> {
    const unit = await this.getUnit.execute(ctx, unitId);
    if (!unit) {
      throw new AppError('NOT_FOUND', 'Unidade não encontrada.', 404);
    }
    return this.list.execute(ctx, unitId);
  }
}
