import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { ListTemplatesRepository } from '../../repositories/template/template.repository.js';
import type { MessageTemplateSummary } from '../../types/messaging.types.js';

export class ListService {
  constructor(private readonly list = new ListTemplatesRepository()) {}

  async execute(ctx: RequestContext): Promise<MessageTemplateSummary[]> {
    return this.list.execute(ctx);
  }
}
