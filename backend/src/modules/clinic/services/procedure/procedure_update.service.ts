import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';
import {
  GetProcedureRepository,
  UpdateProcedureRepository,
} from '../../repositories/procedure/procedure.repository.js';
import type { ProcedureUpdateSchema } from '../../schemas/clinic.schema.js';
import type { ProcedureSummary } from '../../types/clinic.types.js';

export class UpdateService {
  constructor(
    private readonly getProcedure = new GetProcedureRepository(),
    private readonly update = new UpdateProcedureRepository(),
  ) {}

  async execute(
    ctx: RequestContext,
    procedureId: string,
    procedureSchema: ProcedureUpdateSchema,
  ): Promise<ProcedureSummary> {
    const existing = await this.getProcedure.execute(ctx, procedureId);
    if (!existing) {
      throw new AppError('NOT_FOUND', 'Procedimento não encontrado.', 404);
    }

    const updated = await this.update.execute(ctx, procedureId, procedureSchema);
    if (!updated) {
      throw new AppError('NOT_FOUND', 'Procedimento não encontrado.', 404);
    }
    return updated;
  }
}
