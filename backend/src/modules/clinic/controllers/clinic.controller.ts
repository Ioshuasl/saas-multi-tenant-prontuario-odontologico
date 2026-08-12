import type { Request, Response } from 'express';
import { AppError } from '../../../shared/middlewares/error_handler.middleware.js';
import {
  businessHoursExceptionSchema,
  businessHoursQuerySchema,
  businessHoursReplaceSchema,
  chairCreateSchema,
  chairIdParamSchema,
  chairUpdateSchema,
  clinicUpdateSchema,
  onboardingUpdateSchema,
  professionalCreateSchema,
  professionalIdParamSchema,
  professionalUpdateSchema,
  unitCreateSchema,
  unitIdParamSchema,
  unitUpdateSchema,
} from '../schemas/clinic.schema.js';
import { GetService as ClinicGetService } from '../services/clinic/clinic_get.service.js';
import { UpdateService as ClinicUpdateService } from '../services/clinic/clinic_update.service.js';
import { ListService as ChairListService } from '../services/chair/chair_list.service.js';
import { CreateService as ChairCreateService } from '../services/chair/chair_create.service.js';
import { UpdateService as ChairUpdateService } from '../services/chair/chair_update.service.js';
import { ListService as HoursListService } from '../services/business_hours/business_hours_list.service.js';
import { ReplaceService as HoursReplaceService } from '../services/business_hours/business_hours_replace.service.js';
import { CreateService as HoursExceptionCreateService } from '../services/business_hours/business_hours_exception_create.service.js';
import { ListService as UnitListService } from '../services/unit/unit_list.service.js';
import { CreateService as UnitCreateService } from '../services/unit/unit_create.service.js';
import { UpdateService as UnitUpdateService } from '../services/unit/unit_update.service.js';
import { ListService as ProfessionalListService } from '../services/professional/professional_list.service.js';
import { CreateService as ProfessionalCreateService } from '../services/professional/professional_create.service.js';
import { UpdateService as ProfessionalUpdateService } from '../services/professional/professional_update.service.js';
import { GetService as OnboardingGetService } from '../services/onboarding/onboarding_get.service.js';
import { UpdateService as OnboardingUpdateService } from '../services/onboarding/onboarding_update.service.js';

function requireCtx(req: Request) {
  if (!req.ctx) {
    throw new AppError('UNAUTHENTICATED', 'Token de acesso ausente.', 401);
  }
  return req.ctx;
}

export class ClinicController {
  constructor(
    private readonly clinicGet = new ClinicGetService(),
    private readonly clinicUpdate = new ClinicUpdateService(),
    private readonly unitList = new UnitListService(),
    private readonly unitCreate = new UnitCreateService(),
    private readonly unitUpdate = new UnitUpdateService(),
    private readonly chairList = new ChairListService(),
    private readonly chairCreate = new ChairCreateService(),
    private readonly chairUpdate = new ChairUpdateService(),
    private readonly hoursList = new HoursListService(),
    private readonly hoursReplace = new HoursReplaceService(),
    private readonly hoursExceptionCreate = new HoursExceptionCreateService(),
    private readonly professionalList = new ProfessionalListService(),
    private readonly professionalCreate = new ProfessionalCreateService(),
    private readonly professionalUpdate = new ProfessionalUpdateService(),
    private readonly onboardingGet = new OnboardingGetService(),
    private readonly onboardingUpdate = new OnboardingUpdateService(),
  ) {}

  getClinic = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const result = await this.clinicGet.execute(ctx);
    res.status(200).json({ data: result });
  };

  updateClinic = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const parsed = clinicUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.clinicUpdate.execute(ctx, parsed.data);
    res.status(200).json({ data: result });
  };

  listUnits = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const result = await this.unitList.execute(ctx);
    res.status(200).json({ data: result });
  };

  createUnit = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const parsed = unitCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.unitCreate.execute(ctx, parsed.data);
    res.status(201).json({ data: result });
  };

  updateUnit = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const params = unitIdParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const parsed = unitUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.unitUpdate.execute(ctx, params.data.id, parsed.data);
    res.status(200).json({ data: result });
  };

  listChairs = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const params = unitIdParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const result = await this.chairList.execute(ctx, params.data.id);
    res.status(200).json({ data: result });
  };

  createChair = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const params = unitIdParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const parsed = chairCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.chairCreate.execute(ctx, params.data.id, parsed.data);
    res.status(201).json({ data: result });
  };

  updateChair = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const params = chairIdParamSchema.safeParse({
      unitId: req.params.id,
      chairId: req.params.chairId,
    });
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const parsed = chairUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.chairUpdate.execute(
      ctx,
      params.data.unitId,
      params.data.chairId,
      parsed.data,
    );
    res.status(200).json({ data: result });
  };

  getBusinessHours = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const parsed = businessHoursQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.hoursList.execute(
      ctx,
      parsed.data.unitId,
      parsed.data.professionalId,
    );
    res.status(200).json({ data: result });
  };

  replaceBusinessHours = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const parsed = businessHoursReplaceSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.hoursReplace.execute(ctx, parsed.data);
    res.status(200).json({ data: result });
  };

  createBusinessHoursException = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const parsed = businessHoursExceptionSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.hoursExceptionCreate.execute(ctx, parsed.data);
    res.status(201).json({ data: result });
  };

  listProfessionals = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const result = await this.professionalList.execute(ctx);
    res.status(200).json({ data: result });
  };

  createProfessional = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const parsed = professionalCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.professionalCreate.execute(ctx, parsed.data);
    res.status(201).json({ data: result });
  };

  updateProfessional = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const params = professionalIdParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const parsed = professionalUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.professionalUpdate.execute(ctx, params.data.id, parsed.data);
    res.status(200).json({ data: result });
  };

  getOnboarding = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const result = await this.onboardingGet.execute(ctx);
    res.status(200).json({ data: result });
  };

  updateOnboarding = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const parsed = onboardingUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.onboardingUpdate.execute(ctx, parsed.data);
    res.status(200).json({ data: result });
  };
}
