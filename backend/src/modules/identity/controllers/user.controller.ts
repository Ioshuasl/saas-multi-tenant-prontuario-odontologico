import type { Request, Response } from 'express';
import { AppError } from '../../../shared/middlewares/error_handler.middleware.js';
import { userIdParamSchema, userUpdateSchema } from '../schemas/user.schema.js';
import { ListService } from '../services/user/user_list.service.js';
import { UpdateService } from '../services/user/user_update.service.js';

function requestMeta(req: Request) {
  return {
    ipAddress: req.ip,
    userAgent: req.header('user-agent') ?? undefined,
  };
}

function requireCtx(req: Request) {
  if (!req.ctx) {
    throw new AppError('UNAUTHENTICATED', 'Token de acesso ausente.', 401);
  }
  return req.ctx;
}

export class UserController {
  constructor(
    private readonly listService = new ListService(),
    private readonly updateService = new UpdateService(),
  ) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const result = await this.listService.execute(ctx);
    res.status(200).json({ data: result });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const params = userIdParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const parsed = userUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.updateService.execute(
      ctx,
      params.data.id,
      parsed.data,
      requestMeta(req),
    );
    res.status(200).json({ data: result });
  };
}
