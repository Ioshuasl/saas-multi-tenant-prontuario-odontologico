import type { Request, Response } from 'express';
import { AppError } from '../../../shared/middlewares/error_handler.middleware.js';
import {
  supportAccessCreateSchema,
  supportAccessIdParamSchema,
} from '../schemas/support_access.schema.js';
import { ApproveService } from '../services/support_access/support_access_approve.service.js';
import { CreateService } from '../services/support_access/support_access_create.service.js';
import { GetService } from '../services/support_access/support_access_get.service.js';

function requireCtx(req: Request) {
  if (!req.ctx) {
    throw new AppError('UNAUTHENTICATED', 'Token de acesso ausente.', 401);
  }
  return req.ctx;
}

export class SupportAccessController {
  constructor(
    private readonly createGrant = new CreateService(),
    private readonly getGrant = new GetService(),
    private readonly approveGrant = new ApproveService(),
  ) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const parsed = supportAccessCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.createGrant.execute(ctx, parsed.data);
    res.status(201).json({ data: result });
  };

  get = async (req: Request, res: Response): Promise<void> => {
    requireCtx(req);
    const params = supportAccessIdParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const result = await this.getGrant.execute(params.data.id);
    res.status(200).json({ data: result });
  };

  approve = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const params = supportAccessIdParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const result = await this.approveGrant.execute(ctx, params.data.id);
    res.status(200).json({ data: result });
  };
}
