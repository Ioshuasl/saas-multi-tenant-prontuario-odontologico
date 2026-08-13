import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { UpdateAction } from '../../actions/tooth_state/tooth_state_update.action.js';
import type { OdontogramToothUpdateSchema } from '../../schemas/odontogram.schema.js';
import type { OdontogramToothUpdateResult } from '../../types/odontogram/odontogram_update.types.js';

export class UpdateService {
  constructor(private readonly updateAction = new UpdateAction()) {}

  async execute(
    ctx: RequestContext,
    patientId: string,
    toothCode: string,
    toothSchema: OdontogramToothUpdateSchema,
  ): Promise<OdontogramToothUpdateResult> {
    return this.updateAction.execute(ctx, patientId, toothCode, toothSchema);
  }
}
