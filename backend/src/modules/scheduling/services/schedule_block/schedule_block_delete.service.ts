import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { ScheduleBlockNotFoundError } from '../../models/errors/scheduling.errors.js';
import { DeleteScheduleBlockRepository } from '../../repositories/schedule_block/schedule_block.repository.js';

export class DeleteService {
  constructor(private readonly remove = new DeleteScheduleBlockRepository()) {}

  async execute(ctx: RequestContext, blockId: string): Promise<{ id: string; deleted: true }> {
    const ok = await this.remove.execute(ctx, blockId);
    if (!ok) throw new ScheduleBlockNotFoundError();
    return { id: blockId, deleted: true };
  }
}
