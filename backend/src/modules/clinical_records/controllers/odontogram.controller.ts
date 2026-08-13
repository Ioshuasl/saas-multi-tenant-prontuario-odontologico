import type { Request, Response } from 'express';
import { AppError } from '../../../shared/middlewares/error_handler.middleware.js';
import { medicalRecordPatientIdParamSchema } from '../schemas/medical_record.schema.js';
import {
  odontogramGetQuerySchema,
  odontogramToothParamSchema,
  odontogramToothUpdateSchema,
} from '../schemas/odontogram.schema.js';
import { GetService } from '../services/odontogram/odontogram_get.service.js';
import { UpdateService } from '../services/odontogram/odontogram_update.service.js';

function requireCtx(req: Request) {
  if (!req.ctx) {
    throw new AppError('UNAUTHENTICATED', 'Token de acesso ausente.', 401);
  }
  return req.ctx;
}

export class OdontogramController {
  constructor(
    private readonly getOdontogram = new GetService(),
    private readonly updateTooth = new UpdateService(),
  ) {}

  get = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const params = medicalRecordPatientIdParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const query = odontogramGetQuerySchema.safeParse(req.query);
    if (!query.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, query.error);
    }
    const result = await this.getOdontogram.execute(ctx, params.data.patientId, query.data);
    res.status(200).json({ data: result });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const params = odontogramToothParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const parsed = odontogramToothUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.updateTooth.execute(
      ctx,
      params.data.patientId,
      params.data.toothCode,
      parsed.data,
    );
    res.status(200).json({ data: result });
  };
}
