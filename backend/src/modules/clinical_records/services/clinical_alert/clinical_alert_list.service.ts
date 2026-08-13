import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { MedicalRecordNotFoundError } from '../../models/errors/clinical_records.errors.js';
import { GetIdRepository } from '../../repositories/medical_record/medical_record_get_id.repository.js';
import { ListRepository } from '../../repositories/clinical_alert/clinical_alert_list.repository.js';
import type { ClinicalAlertListQuerySchema } from '../../schemas/clinical_alert.schema.js';
import type { ClinicalAlertSummary } from '../../types/medical_record/medical_record_get.types.js';

export class ListService {
  constructor(
    private readonly getRecordId = new GetIdRepository(),
    private readonly list = new ListRepository(),
  ) {}

  async execute(
    ctx: RequestContext,
    patientId: string,
    query: ClinicalAlertListQuerySchema,
  ): Promise<{ items: ClinicalAlertSummary[] }> {
    const recordId = await this.getRecordId.execute(ctx, patientId);
    if (!recordId) throw new MedicalRecordNotFoundError();
    const items = await this.list.execute(ctx, patientId, query);
    return { items };
  }
}
