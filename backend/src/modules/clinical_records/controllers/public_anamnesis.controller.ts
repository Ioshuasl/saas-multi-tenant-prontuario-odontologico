import type { Request, Response } from 'express';
import { AppError } from '../../../shared/middlewares/error_handler.middleware.js';
import { clientIp } from '../../../shared/middlewares/rate_limit.middleware.js';
import {
  anamnesisAnswersSchema,
  publicAnamnesisTokenParamSchema,
} from '../schemas/anamnesis.schema.js';
import { PublicGetService } from '../services/anamnesis/anamnesis_public_get.service.js';
import { PublicSubmitService } from '../services/anamnesis/anamnesis_public_submit.service.js';

export class PublicAnamnesisController {
  constructor(
    private readonly publicGet = new PublicGetService(),
    private readonly publicSubmit = new PublicSubmitService(),
  ) {}

  get = async (req: Request, res: Response): Promise<void> => {
    const params = publicAnamnesisTokenParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const result = await this.publicGet.execute(req.requestId, params.data.token);
    res.status(200).json({ data: result });
  };

  submit = async (req: Request, res: Response): Promise<void> => {
    const params = publicAnamnesisTokenParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const parsed = anamnesisAnswersSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.publicSubmit.execute(req.requestId, params.data.token, parsed.data, {
      ip: clientIp(req),
      userAgent: req.header('user-agent') ?? undefined,
    });
    res.status(200).json({ data: result });
  };
}
