import type { Request, Response } from 'express';
import { AppError } from '../../../shared/middlewares/error_handler.middleware.js';
import { paymentIdParamSchema, paymentReverseSchema, receiptSendSchema } from '../schemas/billing.schema.js';
import { ReverseService } from '../services/payment/payment_reverse.service.js';
import { GetPdfService } from '../services/payment/payment_receipt.service.js';
import { SendService } from '../services/payment/payment_send_receipt.service.js';

function requireCtx(req: Request) {
  if (!req.ctx) {
    throw new AppError('UNAUTHENTICATED', 'Token de acesso ausente.', 401);
  }
  return req.ctx;
}

export class PaymentController {
  constructor(
    private readonly reversePayment = new ReverseService(),
    private readonly receiptPdf = new GetPdfService(),
    private readonly sendReceipt = new SendService(),
  ) {}

  getReceipt = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const params = paymentIdParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const result = await this.receiptPdf.execute(ctx, params.data.id);
    res.status(200).json({ data: result });
  };

  sendReceiptToPatient = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const params = paymentIdParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const parsed = receiptSendSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.sendReceipt.execute(ctx, params.data.id, parsed.data);
    res.status(200).json({ data: result });
  };

  reverse = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const params = paymentIdParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const parsed = paymentReverseSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const idempotencyKey = req.header('idempotency-key') ?? req.header('Idempotency-Key');
    const result = await this.reversePayment.execute(ctx, params.data.id, parsed.data, idempotencyKey);
    res.status(200).json({ data: result });
  };
}
