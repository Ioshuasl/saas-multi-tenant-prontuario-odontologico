import type { Request, Response } from 'express';
import { AppError } from '../../../shared/middlewares/error_handler.middleware.js';
import { CheckoutNotImplementedError } from '../models/errors/subscription.errors.js';
import { GetService, ListService } from '../services/subscription/subscription_get.service.js';
import { GetService as UsageGetService } from '../services/usage/usage_get.service.js';

function requireCtx(req: Request) {
  if (!req.ctx) {
    throw new AppError('UNAUTHENTICATED', 'Token de acesso ausente.', 401);
  }
  return req.ctx;
}

export class SubscriptionController {
  constructor(
    private readonly get = new GetService(),
    private readonly listPlans = new ListService(),
    private readonly usage = new UsageGetService(),
  ) {}

  getSubscription = async (req: Request, res: Response): Promise<void> => {
    const result = await this.get.execute(requireCtx(req));
    res.status(200).json({ data: result });
  };

  listPlansHandler = async (req: Request, res: Response): Promise<void> => {
    const result = await this.listPlans.execute(requireCtx(req));
    res.status(200).json({ data: result });
  };

  getUsage = async (req: Request, res: Response): Promise<void> => {
    const result = await this.usage.execute(requireCtx(req));
    res.status(200).json({ data: result });
  };

  checkout = async (_req: Request, _res: Response): Promise<void> => {
    throw new CheckoutNotImplementedError();
  };
}
