import type { Request, Response } from 'express';
import { AppError } from '../../../shared/middlewares/error_handler.middleware.js';
import {
  financialCategoryCreateSchema,
  financialCategoryListQuerySchema,
} from '../schemas/billing.schema.js';
import { ListService } from '../services/financial_category/financial_category_list.service.js';
import { CreateService } from '../services/financial_category/financial_category_create.service.js';

function requireCtx(req: Request) {
  if (!req.ctx) {
    throw new AppError('UNAUTHENTICATED', 'Token de acesso ausente.', 401);
  }
  return req.ctx;
}

export class FinancialCategoryController {
  constructor(
    private readonly listCategory = new ListService(),
    private readonly createCategory = new CreateService(),
  ) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const parsed = financialCategoryListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const items = await this.listCategory.execute(ctx, parsed.data);
    res.status(200).json({ data: items });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const parsed = financialCategoryCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.createCategory.execute(ctx, parsed.data);
    res.status(201).json({ data: result });
  };
}
