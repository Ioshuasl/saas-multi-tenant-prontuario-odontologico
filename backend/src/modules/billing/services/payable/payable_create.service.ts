import type { RequestContext } from '../../../../shared/domain/request_context.js';
import {
  CategoryNotExpenseError,
  CategoryNotFoundError,
  UnitNotFoundError,
} from '../../models/errors/billing.errors.js';
import { GetRepository as GetCategoryRepository } from '../../repositories/financial_category/financial_category_get.repository.js';
import { GetUnitRepository } from '../../repositories/cash_session/cash_session_get.repository.js';
import { CreateRepository } from '../../repositories/payable/payable_create.repository.js';
import type { PayableCreateSchema } from '../../schemas/billing.schema.js';
import { tenantToday } from '../../helpers/tenant_today.helper.js';

export class CreateService {
  constructor(
    private readonly create = new CreateRepository(),
    private readonly getCategory = new GetCategoryRepository(),
    private readonly getUnit = new GetUnitRepository(),
  ) {}

  async execute(ctx: RequestContext, payableSchema: PayableCreateSchema) {
    const today = await tenantToday(ctx);
    const unit = await this.getUnit.execute(ctx, payableSchema.unitId);
    if (!unit) throw new UnitNotFoundError();
    const category = await this.getCategory.execute(ctx, payableSchema.categoryId);
    if (!category) throw new CategoryNotFoundError();
    if (category.kind !== 'EXPENSE') throw new CategoryNotExpenseError();
    return this.create.execute(
      ctx,
      {
        unitId: payableSchema.unitId,
        categoryId: payableSchema.categoryId,
        description: payableSchema.description,
        amountCents: BigInt(payableSchema.amountCents),
        dueDate: payableSchema.dueDate,
        supplier: payableSchema.supplier ?? null,
        recurrence: payableSchema.recurrence ?? null,
      },
      today,
    );
  }
}
