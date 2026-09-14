import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { CreateAction } from '../../actions/data_subject_request/data_subject_request_create.action.js';
import { toDataSubjectRequestView } from '../../repositories/data_subject_request/mappers/data_subject_request.mapper.js';
import type { DataSubjectRequestCreateSchema } from '../../schemas/data_subject_request.schema.js';
import type { DataSubjectRequestView } from '../../types/data_subject_request/data_subject_request.types.js';

export class CreateService {
  constructor(private readonly createAction = new CreateAction()) {}

  async execute(
    ctx: RequestContext,
    dataSubjectRequestSchema: DataSubjectRequestCreateSchema,
  ): Promise<DataSubjectRequestView> {
    const row = await this.createAction.execute(ctx, dataSubjectRequestSchema);
    return toDataSubjectRequestView(row);
  }
}
