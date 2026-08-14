import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { CreateAction } from '../../actions/receivable/receivable_create.action.js';
import type { ReceivableCreateSchema } from '../../schemas/billing.schema.js';

export class CreateService {
  constructor(private readonly create = new CreateAction()) {}

  execute(ctx: RequestContext, receivableSchema: ReceivableCreateSchema) {
    return this.create.execute(ctx, receivableSchema);
  }
}
