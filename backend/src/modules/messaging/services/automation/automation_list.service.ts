import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { ListAutomationsRepository } from '../../repositories/automation/automation.repository.js';
import type { AutomationSummary } from '../../types/messaging.types.js';

export class ListService {
  constructor(private readonly list = new ListAutomationsRepository()) {}

  async execute(ctx: RequestContext): Promise<AutomationSummary[]> {
    return this.list.execute(ctx);
  }
}
