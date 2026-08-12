import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';
import { assertNoHoursOverlap } from '../../models/business_hours/hours_overlap.guard.js';
import { HoursOverlapError, InvalidHoursError } from '../../models/errors/clinic.errors.js';
import { ReplaceHoursRepository } from '../../repositories/business_hours/business_hours.repository.js';
import { GetUnitRepository } from '../../repositories/unit/unit.repository.js';
import { GetProfessionalRepository } from '../../repositories/professional/professional.repository.js';
import type { BusinessHoursReplaceSchema } from '../../schemas/clinic.schema.js';
import type { BusinessHoursSlot } from '../../types/clinic.types.js';

export class ReplaceService {
  constructor(
    private readonly getUnit = new GetUnitRepository(),
    private readonly getProfessional = new GetProfessionalRepository(),
    private readonly replace = new ReplaceHoursRepository(),
  ) {}

  async execute(
    ctx: RequestContext,
    hoursSchema: BusinessHoursReplaceSchema,
  ): Promise<BusinessHoursSlot[]> {
    const unit = await this.getUnit.execute(ctx, hoursSchema.unitId);
    if (!unit) {
      throw new AppError('NOT_FOUND', 'Unidade não encontrada.', 404);
    }

    if (hoursSchema.professionalId) {
      const professional = await this.getProfessional.execute(ctx, hoursSchema.professionalId);
      if (!professional) {
        throw new AppError('NOT_FOUND', 'Profissional não encontrado.', 404);
      }
    }

    for (const slot of hoursSchema.slots) {
      if (slot.endsAt <= slot.startsAt) {
        throw new InvalidHoursError('Horário de término deve ser após o início.');
      }
    }

    try {
      assertNoHoursOverlap(hoursSchema.slots);
    } catch {
      throw new HoursOverlapError();
    }

    return this.replace.execute(ctx, {
      unitId: hoursSchema.unitId,
      professionalId: hoursSchema.professionalId,
      slots: hoursSchema.slots,
    });
  }
}
