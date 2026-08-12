import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';
import {
  GetProfessionalRepository,
  UpdateProfessionalRepository,
} from '../../repositories/professional/professional.repository.js';
import type { ProfessionalUpdateSchema } from '../../schemas/clinic.schema.js';
import type { ProfessionalSummary } from '../../types/clinic.types.js';

export class UpdateService {
  constructor(
    private readonly getProfessional = new GetProfessionalRepository(),
    private readonly update = new UpdateProfessionalRepository(),
  ) {}

  async execute(
    ctx: RequestContext,
    professionalId: string,
    professionalSchema: ProfessionalUpdateSchema,
  ): Promise<ProfessionalSummary> {
    const existing = await this.getProfessional.execute(ctx, professionalId);
    if (!existing) {
      throw new AppError('NOT_FOUND', 'Profissional não encontrado.', 404);
    }

    const nextCro = professionalSchema.croNumber ?? existing.croNumber;
    const nextState = professionalSchema.croState ?? existing.croState;
    if (existing.role === 'DENTIST' && professionalSchema.active !== false) {
      if (!nextCro || !nextState) {
        throw new AppError(
          'VALIDATION_ERROR',
          'Dentista exige CRO e UF para assinar evoluções.',
          422,
        );
      }
    }

    const updated = await this.update.execute(ctx, professionalId, professionalSchema);
    if (!updated) {
      throw new AppError('NOT_FOUND', 'Profissional não encontrado.', 404);
    }
    return updated;
  }
}
