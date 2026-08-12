import type { Request, Response } from 'express';
import { AppError } from '../../../shared/middlewares/error_handler.middleware.js';
import {
  appointmentCancelSchema,
  appointmentCreateSchema,
  appointmentIdParamSchema,
  appointmentListQuerySchema,
  appointmentStatusSchema,
  appointmentUpdateSchema,
  availabilityQuerySchema,
} from '../schemas/scheduling.schema.js';
import { CreateService as AppointmentCreateService } from '../services/appointment/appointment_create.service.js';
import { ListService as AppointmentListService } from '../services/appointment/appointment_list.service.js';
import { GetService as AppointmentGetService } from '../services/appointment/appointment_get.service.js';
import { UpdateService as AppointmentUpdateService } from '../services/appointment/appointment_update.service.js';
import { StatusService } from '../services/appointment/appointment_status.service.js';
import { DeleteService as AppointmentDeleteService } from '../services/appointment/appointment_delete.service.js';
import { HistoryService } from '../services/appointment/appointment_history.service.js';
import { AvailabilityService } from '../services/availability/availability_get.service.js';
import { AppointmentNotFoundError } from '../models/errors/scheduling.errors.js';

function requireCtx(req: Request) {
  if (!req.ctx) {
    throw new AppError('UNAUTHENTICATED', 'Token de acesso ausente.', 401);
  }
  return req.ctx;
}

export class AppointmentController {
  constructor(
    private readonly appointmentCreate = new AppointmentCreateService(),
    private readonly appointmentList = new AppointmentListService(),
    private readonly appointmentGet = new AppointmentGetService(),
    private readonly appointmentUpdate = new AppointmentUpdateService(),
    private readonly appointmentStatus = new StatusService(),
    private readonly appointmentDelete = new AppointmentDeleteService(),
    private readonly appointmentHistory = new HistoryService(),
    private readonly availabilityGet = new AvailabilityService(),
  ) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const parsed = appointmentListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.appointmentList.execute(ctx, parsed.data);
    res.status(200).json({ data: result });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const parsed = appointmentCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const idempotencyKey = req.header('idempotency-key') ?? req.header('Idempotency-Key');
    const result = await this.appointmentCreate.execute(ctx, parsed.data, idempotencyKey);
    res.status(201).json({
      data: {
        ...result,
        scheduledNotifications: [],
      },
    });
  };

  get = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const params = appointmentIdParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const result = await this.appointmentGet.execute(ctx, params.data.id);
    if (!result) throw new AppointmentNotFoundError();
    res.status(200).json({ data: result });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const params = appointmentIdParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const parsed = appointmentUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.appointmentUpdate.execute(ctx, params.data.id, parsed.data);
    res.status(200).json({ data: result });
  };

  changeStatus = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const params = appointmentIdParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const parsed = appointmentStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.appointmentStatus.execute(ctx, params.data.id, parsed.data);
    res.status(200).json({ data: result });
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const params = appointmentIdParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const parsed = appointmentCancelSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Cancelamento exige motivo.', 400, parsed.error);
    }
    const result = await this.appointmentDelete.execute(
      ctx,
      params.data.id,
      parsed.data.reason,
    );
    res.status(200).json({ data: result });
  };

  history = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const params = appointmentIdParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const result = await this.appointmentHistory.execute(ctx, params.data.id);
    res.status(200).json({ data: result });
  };

  availability = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const parsed = availabilityQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.availabilityGet.execute(ctx, parsed.data);
    res.status(200).json({ data: result });
  };
}
