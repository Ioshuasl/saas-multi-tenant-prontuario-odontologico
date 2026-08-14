import type { Request, Response } from 'express';
import { AppError } from '../../../shared/middlewares/error_handler.middleware.js';
import {
  receivableCancelSchema,
  receivableCreateSchema,
  receivableIdParamSchema,
  receivableListQuerySchema,
} from '../schemas/billing.schema.js';
import { ListService } from '../services/receivable/receivable_list.service.js';
import { GetService } from '../services/receivable/receivable_get.service.js';
import { CreateService } from '../services/receivable/receivable_create.service.js';
import { CancelService } from '../services/receivable/receivable_cancel.service.js';

function requireCtx(req: Request) {
  if (!req.ctx) {
    throw new AppError('UNAUTHENTICATED', 'Token de acesso ausente.', 401);
  }
  return req.ctx;
}

export class ReceivableController {
  constructor(
    private readonly listReceivable = new ListService(),
    private readonly getReceivable = new GetService(),
    private readonly createReceivable = new CreateService(),
    private readonly cancelReceivable = new CancelService(),
  ) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const parsed = receivableListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.listReceivable.execute(ctx, parsed.data);
    res.status(200).json({ data: result.items, meta: { nextCursor: result.nextCursor } });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const parsed = receivableCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.createReceivable.execute(ctx, parsed.data);
    res.status(201).json({ data: result });
  };

  get = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const params = receivableIdParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const result = await this.getReceivable.execute(ctx, params.data.id);
    res.status(200).json({ data: result });
  };

  cancel = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const params = receivableIdParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const parsed = receivableCancelSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.cancelReceivable.execute(ctx, params.data.id, parsed.data);
    res.status(200).json({ data: result });
  };
}
