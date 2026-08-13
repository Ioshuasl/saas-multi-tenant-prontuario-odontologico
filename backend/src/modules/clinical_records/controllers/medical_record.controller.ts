import type { Request, Response } from 'express';
import { AppError } from '../../../shared/middlewares/error_handler.middleware.js';
import { medicalRecordPatientIdParamSchema } from '../schemas/medical_record.schema.js';
import { GetService } from '../services/medical_record/medical_record_get.service.js';

function requireCtx(req: Request) {
  if (!req.ctx) {
    throw new AppError('UNAUTHENTICATED', 'Token de acesso ausente.', 401);
  }
  return req.ctx;
}

export class MedicalRecordController {
  constructor(private readonly getRecord = new GetService()) {}

  get = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const parsed = medicalRecordPatientIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const record = await this.getRecord.execute(ctx, parsed.data.patientId);
    res.status(200).json({ data: record });
  };
}
