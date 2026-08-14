import type { RequestContext } from '../../../../shared/domain/request_context.js';
import {
  CategoryNotExpenseError,
  CategoryNotFoundError,
  PayableNotFoundError,
  PayableNotOpenError,
} from '../../models/errors/billing.errors.js';
import { GetRepository as GetCategoryRepository } from '../../repositories/financial_category/financial_category_get.repository.js';
import { GetRawRepository } from '../../repositories/payable/payable_get.repository.js';
import { UpdateRepository } from '../../repositories/payable/payable_update.repository.js';
import type { PayableUpdateSchema } from '../../schemas/billing.schema.js';
import { tenantToday } from '../../helpers/tenant_today.helper.js';

export class UpdateService {
  constructor(
    private readonly getRaw = new GetRawRepository(),
    private readonly getCategory = new GetCategoryRepository(),
    private readonly update = new UpdateRepository(),
  ) {}

  async execute(ctx: RequestContext, payableId: string, payableSchema: PayableUpdateSchema) {
    const today = await tenantToday(ctx);
    const row = await this.getRaw.execute(ctx, payableId);
    if (!row) throw new PayableNotFoundError();
    if (row.status !== 'OPEN') throw new PayableNotOpenError();
    if (payableSchema.categoryId) {
      const category = await this.getCategory.execute(ctx, payableSchema.categoryId);
      if (!category) throw new CategoryNotFoundError();
      if (category.kind !== 'EXPENSE') throw new CategoryNotExpenseError();
    }
    return this.update.execute(
      ctx,
      payableId,
      {
        categoryId: payableSchema.categoryId,
        description: payableSchema.description,
        amountCents: payableSchema.amountCents === undefined ? undefined : BigInt(payableSchema.amountCents),
        dueDate: payableSchema.dueDate,
        supplier: payableSchema.supplier,
        recurrence: payableSchema.recurrence,
      },
      today,
    );
  }
}
