import type { RequestContext } from '../../../../shared/domain/request_context.js';
import {
  ClinicalAlertNotFoundError,
  CriticalAlertNotDismissableError,
} from '../../models/errors/clinical_records.errors.js';
import { GetRepository } from '../../repositories/clinical_alert/clinical_alert_get.repository.js';
import { UpdateRepository } from '../../repositories/clinical_alert/clinical_alert_update.repository.js';
import type { ClinicalAlertUpdateSchema } from '../../schemas/clinical_alert.schema.js';
import type { ClinicalAlertSummary } from '../../types/medical_record/medical_record_get.types.js';

export class UpdateService {
  constructor(
    private readonly getAlert = new GetRepository(),
    private readonly update = new UpdateRepository(),
  ) {}

  async execute(
    ctx: RequestContext,
    patientId: string,
    alertId: string,
    alertSchema: ClinicalAlertUpdateSchema,
  ): Promise<ClinicalAlertSummary> {
    const current = await this.getAlert.execute(ctx, patientId, alertId);
    if (!current) throw new ClinicalAlertNotFoundError();
    if (current.severity === 'CRITICAL' && alertSchema.active === false) {
      throw new CriticalAlertNotDismissableError();
    }
    await this.update.execute(ctx, alertId, { active: alertSchema.active });
    return { ...current, active: alertSchema.active };
  }
}
