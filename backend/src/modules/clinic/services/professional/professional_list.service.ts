import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { ListProfessionalsRepository } from '../../repositories/professional/professional.repository.js';
import type { ProfessionalSummary } from '../../types/clinic.types.js';

export class ListService {
  constructor(private readonly list = new ListProfessionalsRepository()) {}

  async execute(ctx: RequestContext): Promise<ProfessionalSummary[]> {
    return this.list.execute(ctx);
  }
}
