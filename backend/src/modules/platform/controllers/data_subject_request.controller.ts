import type { Request, Response } from 'express';
import { AppError } from '../../../shared/middlewares/error_handler.middleware.js';
import {
  dataSubjectRequestCreateSchema,
  dataSubjectRequestIdParamSchema,
  dataSubjectRequestListQuerySchema,
  dataSubjectRequestUpdateSchema,
} from '../schemas/data_subject_request.schema.js';
import { CreateService } from '../services/data_subject_request/data_subject_request_create.service.js';
import { GetService } from '../services/data_subject_request/data_subject_request_get.service.js';
import { ListService } from '../services/data_subject_request/data_subject_request_list.service.js';
import { UpdateService } from '../services/data_subject_request/data_subject_request_update.service.js';

function requireCtx(req: Request) {
  if (!req.ctx) {
    throw new AppError('UNAUTHENTICATED', 'Token de acesso ausente.', 401);
  }
  return req.ctx;
}

export class DataSubjectRequestController {
  constructor(
    private readonly listRequests = new ListService(),
    private readonly getRequest = new GetService(),
    private readonly createRequest = new CreateService(),
    private readonly updateRequest = new UpdateService(),
  ) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const parsed = dataSubjectRequestListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.listRequests.execute(ctx, parsed.data);
    res.status(200).json({ data: result });
  };

  get = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const params = dataSubjectRequestIdParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const result = await this.getRequest.execute(ctx, params.data.id);
    res.status(200).json({ data: result });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const parsed = dataSubjectRequestCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.createRequest.execute(ctx, parsed.data);
    res.status(201).json({ data: result });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const params = dataSubjectRequestIdParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const parsed = dataSubjectRequestUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.updateRequest.execute(ctx, params.data.id, parsed.data);
    res.status(200).json({ data: result });
  };
}
