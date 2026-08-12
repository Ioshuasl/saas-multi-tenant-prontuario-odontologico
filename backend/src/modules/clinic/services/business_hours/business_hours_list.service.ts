import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';
import { ListHoursRepository } from '../../repositories/business_hours/business_hours.repository.js';
import { GetUnitRepository } from '../../repositories/unit/unit.repository.js';
import type { BusinessHoursSlot } from '../../types/clinic.types.js';

export class ListService {
  constructor(
    private readonly getUnit = new GetUnitRepository(),
    private readonly list = new ListHoursRepository(),
  ) {}

  async execute(
    ctx: RequestContext,
    unitId: string,
    professionalId?: string,
  ): Promise<BusinessHoursSlot[]> {
    const unit = await this.getUnit.execute(ctx, unitId);
    if (!unit) {
      throw new AppError('NOT_FOUND', 'Unidade não encontrada.', 404);
    }
    return this.list.execute(ctx, unitId, professionalId);
  }
}
