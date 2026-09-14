import type { Request, Response } from 'express';
import { AppError } from '../../../shared/middlewares/error_handler.middleware.js';
import { CheckoutNotImplementedError } from '../models/errors/subscription.errors.js';
import { opsStatusBodySchema } from '../schemas/subscription.schema.js';
import { ListService as PlanListService } from '../services/plan/plan_list.service.js';
import { GetService as SubscriptionGetService } from '../services/subscription/subscription_get.service.js';
import { UpdateStatusService } from '../services/subscription/subscription_update_status.service.js';
import { GetService as UsageGetService } from '../services/usage/usage_get.service.js';

function requireCtx(req: Request) {
  if (!req.ctx) {
    throw new AppError('UNAUTHENTICATED', 'Token de acesso ausente.', 401);
  }
  return req.ctx;
}

export class SubscriptionController {
  constructor(
    private readonly subscriptionGet = new SubscriptionGetService(),
    private readonly planList = new PlanListService(),
    private readonly usageGet = new UsageGetService(),
    private readonly updateStatus = new UpdateStatusService(),
  ) {}

  get = async (req: Request, res: Response): Promise<void> => {
    const data = await this.subscriptionGet.execute(requireCtx(req));
    res.status(200).json({ data });
  };

  listPlans = async (_req: Request, res: Response): Promise<void> => {
    const data = await this.planList.execute();
    res.status(200).json({ data });
  };

  getUsage = async (req: Request, res: Response): Promise<void> => {
    const data = await this.usageGet.execute(requireCtx(req));
    res.status(200).json({ data });
  };

  checkout = async (_req: Request, _res: Response): Promise<void> => {
    throw new CheckoutNotImplementedError();
  };

  /** Ops: muda status ACTIVE/SUSPENDED etc. (ADR-0010 — sem checkout). */
  opsUpdateStatus = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const parsed = opsStatusBodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const data = await this.updateStatus.execute(ctx, parsed.data);
    res.status(200).json({ data });
  };
}
