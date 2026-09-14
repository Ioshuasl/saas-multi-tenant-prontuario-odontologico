import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { ListRepository } from '../../repositories/data_subject_request/data_subject_request_list.repository.js';
import type { DataSubjectRequestListQuerySchema } from '../../schemas/data_subject_request.schema.js';
import type { DataSubjectRequestListResult } from '../../types/data_subject_request/data_subject_request.types.js';

const DEFAULT_LIMIT = 50;

export class ListService {
  constructor(private readonly list = new ListRepository()) {}

  async execute(
    ctx: RequestContext,
    dataSubjectRequestSchema: DataSubjectRequestListQuerySchema,
  ): Promise<DataSubjectRequestListResult> {
    return this.list.execute(ctx, {
      patientId: dataSubjectRequestSchema.patientId,
      status: dataSubjectRequestSchema.status,
      type: dataSubjectRequestSchema.type,
      cursor: dataSubjectRequestSchema.cursor,
      limit: dataSubjectRequestSchema.limit ?? DEFAULT_LIMIT,
    });
  }
}
