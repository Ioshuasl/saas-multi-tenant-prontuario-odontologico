import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';
import { DuplicateNameError } from '../../models/errors/clinic.errors.js';
import {
  FindByNameRepository,
  GetUnitRepository,
  UpdateUnitRepository,
} from '../../repositories/unit/unit.repository.js';
import type { UnitUpdateSchema } from '../../schemas/clinic.schema.js';
import type { UnitSummary } from '../../types/clinic.types.js';

export class UpdateService {
  constructor(
    private readonly getUnit = new GetUnitRepository(),
    private readonly findByName = new FindByNameRepository(),
    private readonly update = new UpdateUnitRepository(),
  ) {}

  async execute(
    ctx: RequestContext,
    unitId: string,
    unitSchema: UnitUpdateSchema,
  ): Promise<UnitSummary> {
    const existing = await this.getUnit.execute(ctx, unitId);
    if (!existing) {
      throw new AppError('NOT_FOUND', 'Unidade não encontrada.', 404);
    }

    if (unitSchema.name) {
      const duplicate = await this.findByName.execute(ctx, unitSchema.name, unitId);
      if (duplicate) {
        throw new DuplicateNameError('Unidade', unitSchema.name);
      }
    }

    const updated = await this.update.execute(ctx, unitId, unitSchema);
    if (!updated) {
      throw new AppError('NOT_FOUND', 'Unidade não encontrada.', 404);
    }
    return updated;
  }
}
