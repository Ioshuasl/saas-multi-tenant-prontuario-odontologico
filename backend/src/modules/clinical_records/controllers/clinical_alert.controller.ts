import type { Request, Response } from 'express';
import { AppError } from '../../../shared/middlewares/error_handler.middleware.js';
import { medicalRecordPatientIdParamSchema } from '../schemas/medical_record.schema.js';
import {
  clinicalAlertCreateSchema,
  clinicalAlertIdParamSchema,
  clinicalAlertListQuerySchema,
  clinicalAlertUpdateSchema,
} from '../schemas/clinical_alert.schema.js';
import { ListService } from '../services/clinical_alert/clinical_alert_list.service.js';
import { CreateService } from '../services/clinical_alert/clinical_alert_create.service.js';
import { UpdateService } from '../services/clinical_alert/clinical_alert_update.service.js';

function requireCtx(req: Request) {
  if (!req.ctx) {
    throw new AppError('UNAUTHENTICATED', 'Token de acesso ausente.', 401);
  }
  return req.ctx;
}

export class ClinicalAlertController {
  constructor(
    private readonly listAlerts = new ListService(),
    private readonly createAlert = new CreateService(),
    private readonly updateAlert = new UpdateService(),
  ) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const params = medicalRecordPatientIdParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const query = clinicalAlertListQuerySchema.safeParse(req.query);
    if (!query.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, query.error);
    }
    const result = await this.listAlerts.execute(ctx, params.data.patientId, query.data);
    res.status(200).json({ data: result });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const params = medicalRecordPatientIdParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const parsed = clinicalAlertCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const alert = await this.createAlert.execute(ctx, params.data.patientId, parsed.data);
    res.status(201).json({ data: alert });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const params = clinicalAlertIdParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const parsed = clinicalAlertUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const alert = await this.updateAlert.execute(ctx, params.data.patientId, params.data.id, parsed.data);
    res.status(200).json({ data: alert });
  };
}
