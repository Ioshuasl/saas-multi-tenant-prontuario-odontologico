import type { Request, Response } from 'express';
import { AppError } from '../../../shared/middlewares/error_handler.middleware.js';
import { publicQuoteTokenParamSchema, quoteDecisionSchema } from '../schemas/quote.schema.js';
import { PublicGetService } from '../services/quote/quote_public_get.service.js';
import { PublicDecideService } from '../services/quote/quote_public_decide.service.js';

export class PublicQuoteController {
  constructor(
    private readonly publicGet = new PublicGetService(),
    private readonly publicDecide = new PublicDecideService(),
  ) {}

  get = async (req: Request, res: Response): Promise<void> => {
    const params = publicQuoteTokenParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const result = await this.publicGet.execute(req.requestId, params.data.token);
    res.status(200).json({ data: result });
  };

  decide = async (req: Request, res: Response): Promise<void> => {
    const params = publicQuoteTokenParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const parsed = quoteDecisionSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const idempotencyKey = req.header('idempotency-key') ?? req.header('Idempotency-Key');
    const result = await this.publicDecide.execute(
      req.requestId,
      params.data.token,
      parsed.data,
      idempotencyKey,
    );
    res.status(200).json({ data: result });
  };
}
