import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';
import { InvalidHoursError } from '../../models/errors/clinic.errors.js';
import { CreateExceptionRepository } from '../../repositories/business_hours/business_hours.repository.js';
import { GetUnitRepository } from '../../repositories/unit/unit.repository.js';
import { GetProfessionalRepository } from '../../repositories/professional/professional.repository.js';
import type { BusinessHoursExceptionSchema } from '../../schemas/clinic.schema.js';
import type { BusinessHoursExceptionSummary } from '../../types/clinic.types.js';

export class CreateService {
  constructor(
    private readonly getUnit = new GetUnitRepository(),
    private readonly getProfessional = new GetProfessionalRepository(),
    private readonly create = new CreateExceptionRepository(),
  ) {}

  async execute(
    ctx: RequestContext,
    exceptionSchema: BusinessHoursExceptionSchema,
  ): Promise<BusinessHoursExceptionSummary> {
    const unit = await this.getUnit.execute(ctx, exceptionSchema.unitId);
    if (!unit) {
      throw new AppError('NOT_FOUND', 'Unidade não encontrada.', 404);
    }

    if (exceptionSchema.professionalId) {
      const professional = await this.getProfessional.execute(ctx, exceptionSchema.professionalId);
      if (!professional) {
        throw new AppError('NOT_FOUND', 'Profissional não encontrado.', 404);
      }
    }

    if (!exceptionSchema.closed) {
      if (!exceptionSchema.startsAt || !exceptionSchema.endsAt) {
        throw new InvalidHoursError('Exceção aberta exige startsAt e endsAt.');
      }
      if (exceptionSchema.endsAt <= exceptionSchema.startsAt) {
        throw new InvalidHoursError('Horário de término deve ser após o início.');
      }
    }

    const created = await this.create.execute(ctx, exceptionSchema);
    return created;
  }
}
