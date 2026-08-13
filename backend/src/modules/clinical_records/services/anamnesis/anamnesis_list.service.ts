import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { MedicalRecordNotFoundError } from '../../models/errors/clinical_records.errors.js';
import { GetIdRepository } from '../../repositories/medical_record/medical_record_get_id.repository.js';
import { ListRepository } from '../../repositories/anamnesis_response/anamnesis_response_list.repository.js';
import type { AnamnesisResponseSummary } from '../../types/anamnesis/anamnesis_list.types.js';

export class ListService {
  constructor(
    private readonly getRecordId = new GetIdRepository(),
    private readonly list = new ListRepository(),
  ) {}

  async execute(
    ctx: RequestContext,
    patientId: string,
  ): Promise<{ items: AnamnesisResponseSummary[] }> {
    const recordId = await this.getRecordId.execute(ctx, patientId);
    if (!recordId) throw new MedicalRecordNotFoundError();
    const items = await this.list.execute(ctx, patientId);
    return { items };
  }
}
