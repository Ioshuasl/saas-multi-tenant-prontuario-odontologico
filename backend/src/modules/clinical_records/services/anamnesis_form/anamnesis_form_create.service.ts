import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { CreateRepository } from '../../repositories/anamnesis_form/anamnesis_form_create.repository.js';
import type { AnamnesisFormCreateSchema } from '../../schemas/anamnesis_form.schema.js';
import type { AnamnesisFormSummary } from '../../types/anamnesis_form/anamnesis_form.types.js';

export class CreateService {
  constructor(private readonly create = new CreateRepository()) {}

  async execute(
    ctx: RequestContext,
    formSchema: AnamnesisFormCreateSchema,
  ): Promise<AnamnesisFormSummary> {
    return this.create.execute(ctx, formSchema);
  }
}
