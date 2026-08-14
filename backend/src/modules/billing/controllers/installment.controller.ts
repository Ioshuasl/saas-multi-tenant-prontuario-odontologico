import type { Request, Response } from 'express';
import { AppError } from '../../../shared/middlewares/error_handler.middleware.js';
import {
  installmentIdParamSchema,
  installmentListQuerySchema,
  installmentChargeSchema,
  paymentCreateSchema,
} from '../schemas/billing.schema.js';
import { ListService } from '../services/installment/installment_list.service.js';
import { RegisterService } from '../services/payment/payment_register.service.js';
import { ChargeService } from '../services/installment/installment_charge.service.js';

function requireCtx(req: Request) {
  if (!req.ctx) {
    throw new AppError('UNAUTHENTICATED', 'Token de acesso ausente.', 401);
  }
  return req.ctx;
}

export class InstallmentController {
  constructor(
    private readonly listInstallment = new ListService(),
    private readonly registerPayment = new RegisterService(),
    private readonly chargeInstallment = new ChargeService(),
  ) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const parsed = installmentListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.listInstallment.execute(ctx, parsed.data);
    res.status(200).json({ data: result.items, meta: { nextCursor: result.nextCursor } });
  };

  createPayment = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const params = installmentIdParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const parsed = paymentCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const idempotencyKey = req.header('idempotency-key') ?? req.header('Idempotency-Key');
    const result = await this.registerPayment.execute(ctx, params.data.id, parsed.data, idempotencyKey);
    res.status(201).json({ data: result });
  };

  charge = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const params = installmentIdParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const parsed = installmentChargeSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.chargeInstallment.execute(ctx, params.data.id, parsed.data);
    res.status(200).json({ data: result });
  };
}
