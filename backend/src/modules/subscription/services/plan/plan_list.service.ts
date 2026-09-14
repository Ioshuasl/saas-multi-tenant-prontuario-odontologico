import { ListRepository } from '../../repositories/plan/plan_list.repository.js';
import type { PlanSummary } from '../../types/subscription.types.js';

export class ListService {
  constructor(private readonly list = new ListRepository()) {}

  async execute(): Promise<PlanSummary[]> {
    return this.list.execute();
  }
}
