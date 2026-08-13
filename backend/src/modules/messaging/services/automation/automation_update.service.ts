import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';
import { UpdateAutomationRepository } from '../../repositories/automation/automation.repository.js';
import type { AutomationPatchSchema } from '../../schemas/messaging.schema.js';
import type { AutomationSummary } from '../../types/messaging.types.js';

export class UpdateService {
  constructor(private readonly update = new UpdateAutomationRepository()) {}

  async execute(
    ctx: RequestContext,
    key: string,
    automationSchema: AutomationPatchSchema,
  ): Promise<AutomationSummary> {
    const updated = await this.update.execute(ctx, key, {
      enabled: automationSchema.enabled,
      config: automationSchema.config,
    });
    if (!updated) {
      throw new AppError('NOT_FOUND', 'Automação não encontrada.', 404);
    }
    return updated;
  }
}
