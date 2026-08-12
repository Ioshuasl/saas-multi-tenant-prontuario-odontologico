import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';
import { GetDefaultUnitRepository } from '../../repositories/appointment/appointment.repository.js';
import {
  CreateScheduleBlockRepository,
} from '../../repositories/schedule_block/schedule_block.repository.js';
import type { ScheduleBlockCreateSchema } from '../../schemas/scheduling.schema.js';
import type { ScheduleBlockSummary } from '../../types/scheduling.types.js';

export class CreateService {
  constructor(
    private readonly getDefaultUnit = new GetDefaultUnitRepository(),
    private readonly create = new CreateScheduleBlockRepository(),
  ) {}

  async execute(
    ctx: RequestContext,
    blockSchema: ScheduleBlockCreateSchema,
  ): Promise<ScheduleBlockSummary> {
    const unitId = blockSchema.unitId ?? (await this.getDefaultUnit.execute(ctx));
    if (!unitId) {
      throw new AppError('VALIDATION_ERROR', 'Unidade padrão não encontrada.', 400);
    }

    const startsAt = new Date(blockSchema.startsAt);
    const endsAt = new Date(blockSchema.endsAt);
    if (!(endsAt > startsAt)) {
      throw new AppError('VALIDATION_ERROR', 'endsAt deve ser após startsAt.', 400);
    }

    if (!blockSchema.professionalId && !blockSchema.chairId) {
      // Unidade inteira — permitido (RF-E4-08).
    }

    return this.create.execute(ctx, {
      unitId,
      professionalId: blockSchema.professionalId,
      chairId: blockSchema.chairId,
      startsAt,
      endsAt,
      reason: blockSchema.reason.trim(),
    });
  }
}
