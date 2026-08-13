import type { Request, Response } from 'express';
import { AppError } from '../../../shared/middlewares/error_handler.middleware.js';
import { clientIp } from '../../../shared/middlewares/rate_limit.middleware.js';
import {
  publicAvailabilityQuerySchema,
  publicBookingCreateSchema,
  publicBookingVerifySchema,
  publicConfirmTokenParamSchema,
} from '../schemas/public_booking.schema.js';
import { GetService as PublicClinicGetService } from '../services/public_booking/public_clinic_get.service.js';
import { GetService as PublicAvailabilityGetService } from '../services/public_booking/public_availability_get.service.js';
import { CreateService as PublicBookingCreateService } from '../services/public_booking/public_booking_create.service.js';
import { VerifyService as PublicBookingVerifyService } from '../services/public_booking/public_booking_verify.service.js';
import { ConfirmService } from '../services/public_booking/public_appointment_confirm.service.js';

function requirePublicCtx(req: Request) {
  if (!req.ctx) {
    throw new AppError('NOT_FOUND', 'Clínica não encontrada.', 404);
  }
  return req.ctx;
}

export class PublicBookingController {
  constructor(
    private readonly clinicGet = new PublicClinicGetService(),
    private readonly availabilityGet = new PublicAvailabilityGetService(),
    private readonly bookingCreate = new PublicBookingCreateService(),
    private readonly bookingVerify = new PublicBookingVerifyService(),
    private readonly appointmentConfirm = new ConfirmService(),
  ) {}

  clinic = async (req: Request, res: Response): Promise<void> => {
    const ctx = requirePublicCtx(req);
    const result = await this.clinicGet.execute(ctx);
    res.status(200).json({ data: result });
  };

  availability = async (req: Request, res: Response): Promise<void> => {
    const ctx = requirePublicCtx(req);
    const parsed = publicAvailabilityQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.availabilityGet.execute(ctx, parsed.data);
    res.status(200).json({ data: result });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const ctx = requirePublicCtx(req);
    const parsed = publicBookingCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.bookingCreate.execute(ctx, parsed.data);
    res.status(201).json({ data: result });
  };

  verify = async (req: Request, res: Response): Promise<void> => {
    const ctx = requirePublicCtx(req);
    const parsed = publicBookingVerifySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.bookingVerify.execute(ctx, parsed.data, {
      ipAddress: clientIp(req),
      userAgent: req.header('user-agent') ?? null,
    });
    res.status(200).json({ data: result });
  };

  confirm = async (req: Request, res: Response): Promise<void> => {
    const params = publicConfirmTokenParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const result = await this.appointmentConfirm.execute(req.requestId, params.data.token);
    res.status(200).json({ data: result });
  };
}
