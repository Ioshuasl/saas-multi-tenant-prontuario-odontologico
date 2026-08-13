import type { Request, Response } from 'express';
import { AppError } from '../../../shared/middlewares/error_handler.middleware.js';
import { clientIp } from '../../../shared/middlewares/rate_limit.middleware.js';
import { medicalRecordPatientIdParamSchema } from '../schemas/medical_record.schema.js';
import { anamnesisAnswersSchema, anamnesisSendLinkSchema } from '../schemas/anamnesis.schema.js';
import { ListService } from '../services/anamnesis/anamnesis_list.service.js';
import { CreateService } from '../services/anamnesis/anamnesis_create.service.js';
import { SendLinkService } from '../services/anamnesis/anamnesis_send_link.service.js';

function requireCtx(req: Request) {
  if (!req.ctx) {
    throw new AppError('UNAUTHENTICATED', 'Token de acesso ausente.', 401);
  }
  return req.ctx;
}

export class AnamnesisController {
  constructor(
    private readonly listAnamnesis = new ListService(),
    private readonly createAnamnesis = new CreateService(),
    private readonly sendLinkService = new SendLinkService(),
  ) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const parsed = medicalRecordPatientIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.listAnamnesis.execute(ctx, parsed.data.patientId);
    res.status(200).json({ data: result });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const params = medicalRecordPatientIdParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const parsed = anamnesisAnswersSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.createAnamnesis.execute(ctx, params.data.patientId, parsed.data, {
      ip: clientIp(req),
      userAgent: req.header('user-agent') ?? undefined,
    });
    res.status(201).json({ data: result });
  };

  sendLink = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const params = medicalRecordPatientIdParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const parsed = anamnesisSendLinkSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.sendLinkService.execute(ctx, params.data.patientId, parsed.data);
    res.status(200).json({ data: result });
  };
}
