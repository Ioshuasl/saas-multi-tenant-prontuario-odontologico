import type { Request, Response } from 'express';
import { AppError } from '../../../shared/middlewares/error_handler.middleware.js';
import { patientIdParamSchema } from '../schemas/billing.schema.js';
import { GetService } from '../services/credit/credit_get.service.js';

function requireCtx(req: Request) {
  if (!req.ctx) {
    throw new AppError('UNAUTHENTICATED', 'Token de acesso ausente.', 401);
  }
  return req.ctx;
}

export class CreditController {
  constructor(private readonly getCredit = new GetService()) {}

  get = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const params = patientIdParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const result = await this.getCredit.execute(ctx, params.data.id);
    res.status(200).json({ data: result });
  };
}
