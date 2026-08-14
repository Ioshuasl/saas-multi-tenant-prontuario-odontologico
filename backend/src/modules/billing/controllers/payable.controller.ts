import type { Request, Response } from 'express';
import { AppError } from '../../../shared/middlewares/error_handler.middleware.js';
import {
  payableCreateSchema,
  payableIdParamSchema,
  payableListQuerySchema,
  payablePaySchema,
  payableUpdateSchema,
} from '../schemas/billing.schema.js';
import { ListService } from '../services/payable/payable_list.service.js';
import { GetService } from '../services/payable/payable_get.service.js';
import { CreateService } from '../services/payable/payable_create.service.js';
import { UpdateService } from '../services/payable/payable_update.service.js';
import { PayService } from '../services/payable/payable_pay.service.js';

function requireCtx(req: Request) {
  if (!req.ctx) {
    throw new AppError('UNAUTHENTICATED', 'Token de acesso ausente.', 401);
  }
  return req.ctx;
}

export class PayableController {
  constructor(
    private readonly listPayable = new ListService(),
    private readonly getPayable = new GetService(),
    private readonly createPayable = new CreateService(),
    private readonly updatePayable = new UpdateService(),
    private readonly payPayable = new PayService(),
  ) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const parsed = payableListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.listPayable.execute(ctx, parsed.data);
    res.status(200).json({ data: result.items, meta: { nextCursor: result.nextCursor } });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const parsed = payableCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.createPayable.execute(ctx, parsed.data);
    res.status(201).json({ data: result });
  };

  get = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const params = payableIdParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const result = await this.getPayable.execute(ctx, params.data.id);
    res.status(200).json({ data: result });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const params = payableIdParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const parsed = payableUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.updatePayable.execute(ctx, params.data.id, parsed.data);
    res.status(200).json({ data: result });
  };

  pay = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const params = payableIdParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const parsed = payablePaySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const idempotencyKey = req.header('idempotency-key') ?? req.header('Idempotency-Key');
    const result = await this.payPayable.execute(ctx, params.data.id, parsed.data, idempotencyKey);
    res.status(200).json({ data: result });
  };
}
