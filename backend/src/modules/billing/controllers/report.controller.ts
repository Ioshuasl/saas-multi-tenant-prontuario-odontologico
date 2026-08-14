import type { Request, Response } from 'express';
import { AppError } from '../../../shared/middlewares/error_handler.middleware.js';
import {
  cashFlowQuerySchema,
  overdueReportQuerySchema,
  productionReportQuerySchema,
} from '../schemas/billing.schema.js';
import { GetService as CashFlowGetService } from '../services/report/cash_flow_get.service.js';
import { GetService as OverdueGetService } from '../services/report/overdue_get.service.js';
import { GetService as ProductionGetService } from '../services/report/production_get.service.js';

function requireCtx(req: Request) {
  if (!req.ctx) {
    throw new AppError('UNAUTHENTICATED', 'Token de acesso ausente.', 401);
  }
  return req.ctx;
}

export class ReportController {
  constructor(
    private readonly cashFlow = new CashFlowGetService(),
    private readonly overdue = new OverdueGetService(),
    private readonly production = new ProductionGetService(),
  ) {}

  getCashFlow = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const parsed = cashFlowQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.cashFlow.execute(ctx, parsed.data);
    res.status(200).json({ data: result });
  };

  getOverdue = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const parsed = overdueReportQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.overdue.execute(ctx, parsed.data);
    res.status(200).json({ data: result });
  };

  getProduction = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const parsed = productionReportQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.production.execute(ctx, parsed.data);
    res.status(200).json({ data: result });
  };
}
