import type { RequestContext } from '../../../../shared/domain/request_context.js';
import {
  CategoryNotFoundError,
  CategoryNameTakenError,
} from '../../models/errors/billing.errors.js';
import { CreateRepository } from '../../repositories/financial_category/financial_category_create.repository.js';
import { GetRepository } from '../../repositories/financial_category/financial_category_get.repository.js';
import type { FinancialCategoryCreateSchema } from '../../schemas/billing.schema.js';

function isUniqueConflict(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const code = String((err as { code?: string }).code ?? '');
  return code === 'P2002' || code === '23505';
}

export class CreateService {
  constructor(
    private readonly create = new CreateRepository(),
    private readonly getCategory = new GetRepository(),
  ) {}

  async execute(ctx: RequestContext, financialCategorySchema: FinancialCategoryCreateSchema) {
    if (financialCategorySchema.parentId) {
      const parent = await this.getCategory.executeAny(ctx, financialCategorySchema.parentId);
      if (!parent) throw new CategoryNotFoundError();
    }
    try {
      return await this.create.execute(ctx, {
        name: financialCategorySchema.name,
        kind: financialCategorySchema.kind,
        parentId: financialCategorySchema.parentId ?? null,
      });
    } catch (err) {
      if (isUniqueConflict(err)) throw new CategoryNameTakenError();
      throw err;
    }
  }
}
