import type { Request, Response } from 'express';
import { AppError } from '../../../shared/middlewares/error_handler.middleware.js';
import {
  treatmentPlanIdParamSchema,
  treatmentPlanListQuerySchema,
} from '../schemas/treatment.schema.js';
import { ListService } from '../services/treatment_plan/treatment_plan_list.service.js';
import { GetService } from '../services/treatment_plan/treatment_plan_get.service.js';

function requireCtx(req: Request) {
  if (!req.ctx) {
    throw new AppError('UNAUTHENTICATED', 'Token de acesso ausente.', 401);
  }
  return req.ctx;
}

export class TreatmentPlanController {
  constructor(
    private readonly listPlans = new ListService(),
    private readonly getPlan = new GetService(),
  ) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const parsed = treatmentPlanListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.listPlans.execute(ctx, parsed.data);
    res.status(200).json({ data: result.items, meta: { nextCursor: result.nextCursor } });
  };

  get = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const params = treatmentPlanIdParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const result = await this.getPlan.execute(ctx, params.data.id);
    res.status(200).json({ data: result });
  };
}
