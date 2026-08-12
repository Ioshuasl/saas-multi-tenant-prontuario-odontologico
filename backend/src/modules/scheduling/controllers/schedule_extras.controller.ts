import type { Request, Response } from 'express';
import { AppError } from '../../../shared/middlewares/error_handler.middleware.js';
import {
  appointmentSeriesCreateSchema,
  appointmentSeriesDeleteQuerySchema,
  appointmentSeriesIdParamSchema,
  scheduleBlockCreateSchema,
  scheduleBlockIdParamSchema,
} from '../schemas/scheduling.schema.js';
import { CreateService as ScheduleBlockCreateService } from '../services/schedule_block/schedule_block_create.service.js';
import { DeleteService as ScheduleBlockDeleteService } from '../services/schedule_block/schedule_block_delete.service.js';
import { CreateService as SeriesCreateService } from '../services/appointment_series/appointment_series_create.service.js';
import { DeleteService as SeriesDeleteService } from '../services/appointment_series/appointment_series_delete.service.js';

function requireCtx(req: Request) {
  if (!req.ctx) {
    throw new AppError('UNAUTHENTICATED', 'Token de acesso ausente.', 401);
  }
  return req.ctx;
}

export class ScheduleBlockController {
  constructor(
    private readonly create = new ScheduleBlockCreateService(),
    private readonly remove = new ScheduleBlockDeleteService(),
  ) {}

  createBlock = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const parsed = scheduleBlockCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.create.execute(ctx, parsed.data);
    res.status(201).json({ data: result });
  };

  deleteBlock = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const params = scheduleBlockIdParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const result = await this.remove.execute(ctx, params.data.id);
    res.status(200).json({ data: result });
  };
}

export class AppointmentSeriesController {
  constructor(
    private readonly create = new SeriesCreateService(),
    private readonly remove = new SeriesDeleteService(),
  ) {}

  createSeries = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const parsed = appointmentSeriesCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.create.execute(ctx, parsed.data);
    res.status(201).json({ data: result });
  };

  deleteSeries = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const params = appointmentSeriesIdParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const query = appointmentSeriesDeleteQuerySchema.safeParse(req.query);
    if (!query.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, query.error);
    }
    const result = await this.remove.execute(ctx, params.data.id, query.data);
    res.status(200).json({ data: result });
  };
}
