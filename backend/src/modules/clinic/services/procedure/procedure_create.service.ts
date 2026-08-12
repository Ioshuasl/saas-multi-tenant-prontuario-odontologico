import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { DuplicateCodeError } from '../../models/errors/clinic.errors.js';
import {
  CreateProcedureRepository,
  FindByCodeRepository,
} from '../../repositories/procedure/procedure.repository.js';
import type { ProcedureCreateSchema } from '../../schemas/clinic.schema.js';
import type { ProcedureSummary } from '../../types/clinic.types.js';

export class CreateService {
  constructor(
    private readonly findByCode = new FindByCodeRepository(),
    private readonly create = new CreateProcedureRepository(),
  ) {}

  async execute(
    ctx: RequestContext,
    procedureSchema: ProcedureCreateSchema,
  ): Promise<ProcedureSummary> {
    const duplicate = await this.findByCode.execute(ctx, procedureSchema.code);
    if (duplicate) {
      throw new DuplicateCodeError(procedureSchema.code);
    }
    return this.create.execute(ctx, procedureSchema);
  }
}
