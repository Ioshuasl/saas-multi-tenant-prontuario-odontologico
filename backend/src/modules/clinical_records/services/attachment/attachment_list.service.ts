import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { MedicalRecordNotFoundError } from '../../models/errors/clinical_records.errors.js';
import { GetIdRepository } from '../../repositories/medical_record/medical_record_get_id.repository.js';
import { ListRepository } from '../../repositories/attachment/attachment_list.repository.js';
import type { AttachmentListQuerySchema } from '../../schemas/attachment.schema.js';
import type { AttachmentListResult } from '../../types/attachment/attachment_list.types.js';

export class ListService {
  constructor(
    private readonly getRecordId = new GetIdRepository(),
    private readonly list = new ListRepository(),
  ) {}

  async execute(
    ctx: RequestContext,
    patientId: string,
    query: AttachmentListQuerySchema,
  ): Promise<AttachmentListResult> {
    const recordId = await this.getRecordId.execute(ctx, patientId);
    if (!recordId) throw new MedicalRecordNotFoundError();
    return this.list.execute(ctx, patientId, { category: query.category });
  }
}
