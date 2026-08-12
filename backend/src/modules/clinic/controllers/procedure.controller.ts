import type { Request, Response } from 'express';
import { AppError } from '../../../shared/middlewares/error_handler.middleware.js';
import {
  procedureCreateSchema,
  procedureIdParamSchema,
  procedureListQuerySchema,
  procedureUpdateSchema,
} from '../schemas/clinic.schema.js';
import { ListService } from '../services/procedure/procedure_list.service.js';
import { CreateService } from '../services/procedure/procedure_create.service.js';
import { UpdateService } from '../services/procedure/procedure_update.service.js';
import { ImportCatalogService } from '../services/procedure/procedure_import_catalog.service.js';

function requireCtx(req: Request) {
  if (!req.ctx) {
    throw new AppError('UNAUTHENTICATED', 'Token de acesso ausente.', 401);
  }
  return req.ctx;
}

export class ProcedureController {
  constructor(
    private readonly listService = new ListService(),
    private readonly createService = new CreateService(),
    private readonly updateService = new UpdateService(),
    private readonly importCatalogService = new ImportCatalogService(),
  ) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const parsed = procedureListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.listService.execute(ctx, {
      search: parsed.data.search,
      specialty: parsed.data.specialty,
      active:
        parsed.data.active === undefined
          ? undefined
          : parsed.data.active === 'true',
    });
    res.status(200).json({ data: result });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const parsed = procedureCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.createService.execute(ctx, parsed.data);
    res.status(201).json({ data: result });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const params = procedureIdParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const parsed = procedureUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.updateService.execute(ctx, params.data.id, parsed.data);
    res.status(200).json({ data: result });
  };

  importCatalog = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const result = await this.importCatalogService.execute(ctx);
    res.status(200).json({ data: result });
  };
}
