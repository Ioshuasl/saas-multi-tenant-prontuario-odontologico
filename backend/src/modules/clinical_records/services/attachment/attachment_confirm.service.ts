import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { ConfirmAction } from '../../actions/attachment/attachment_confirm.action.js';
import type { AttachmentConfirmSchema } from '../../schemas/attachment.schema.js';
import type { AttachmentSummary } from '../../types/attachment/attachment_list.types.js';

export class ConfirmService {
  constructor(private readonly confirmAction = new ConfirmAction()) {}

  async execute(
    ctx: RequestContext,
    patientId: string,
    confirmSchema: AttachmentConfirmSchema,
  ): Promise<AttachmentSummary> {
    return this.confirmAction.execute(ctx, patientId, confirmSchema);
  }
}
