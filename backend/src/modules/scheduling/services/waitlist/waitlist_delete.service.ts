import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';
import { WaitlistNotFoundError } from '../../models/errors/scheduling.errors.js';
import { GetRepository } from '../../repositories/waitlist/waitlist_get.repository.js';
import { UpdateRepository } from '../../repositories/waitlist/waitlist_update.repository.js';

export class DeleteService {
  constructor(
    private readonly get = new GetRepository(),
    private readonly update = new UpdateRepository(),
  ) {}

  async execute(ctx: RequestContext, waitlistId: string) {
    const current = await this.get.execute(ctx, waitlistId);
    if (!current) throw new WaitlistNotFoundError();
    if (current.status === 'SCHEDULED') {
      throw new AppError(
        'BUSINESS_RULE_VIOLATION',
        'Não é possível remover uma entrada já agendada.',
        422,
      );
    }
    if (current.status === 'CANCELLED') return current;

    const updated = await this.update.execute(ctx, waitlistId, { status: 'CANCELLED' });
    if (!updated) throw new WaitlistNotFoundError();
    return updated;
  }
}
