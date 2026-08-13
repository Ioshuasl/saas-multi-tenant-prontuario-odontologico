import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { ListRepository } from '../../repositories/anamnesis_form/anamnesis_form_list.repository.js';
import type { AnamnesisFormSummary } from '../../types/anamnesis_form/anamnesis_form.types.js';

export class ListService {
  constructor(private readonly list = new ListRepository()) {}

  async execute(ctx: RequestContext): Promise<{ items: AnamnesisFormSummary[] }> {
    const items = await this.list.execute(ctx);
    return { items };
  }
}
