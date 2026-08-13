import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { CreateAction } from '../../actions/clinical_alert/clinical_alert_create.action.js';
import type { ClinicalAlertCreateSchema } from '../../schemas/clinical_alert.schema.js';
import type { ClinicalAlertSummary } from '../../types/medical_record/medical_record_get.types.js';

export class CreateService {
  constructor(private readonly createAction = new CreateAction()) {}

  async execute(
    ctx: RequestContext,
    patientId: string,
    alertSchema: ClinicalAlertCreateSchema,
  ): Promise<ClinicalAlertSummary> {
    return this.createAction.execute(ctx, patientId, alertSchema);
  }
}
