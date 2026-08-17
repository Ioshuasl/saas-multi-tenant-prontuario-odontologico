import type { Request, Response } from 'express';
import { AppError } from '../../../shared/middlewares/error_handler.middleware.js';
import {
  tenantExportCreateSchema,
  tenantExportIdParamSchema,
} from '../schemas/tenant_export.schema.js';
import { CreateService } from '../services/tenant_export/tenant_export_create.service.js';
import { GetService } from '../services/tenant_export/tenant_export_get.service.js';

function requireCtx(req: Request) {
  if (!req.ctx) {
    throw new AppError('UNAUTHENTICATED', 'Token de acesso ausente.', 401);
  }
  return req.ctx;
}

function idempotencyKeyOf(req: Request): string | undefined {
  const raw = req.header('idempotency-key')?.trim();
  return raw && raw.length > 0 ? raw.slice(0, 128) : undefined;
}

export class TenantExportController {
  constructor(
    private readonly createExport = new CreateService(),
    private readonly getExport = new GetService(),
  ) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const parsed = tenantExportCreateSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.createExport.execute(ctx, parsed.data, {
      idempotencyKey: idempotencyKeyOf(req),
    });
    res.status(202).json({ data: result });
  };

  get = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const params = tenantExportIdParamSchema.safeParse(req.params);
    if (!params.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, params.error);
    }
    const result = await this.getExport.execute(ctx, params.data.id);
    res.status(200).json({ data: result });
  };
}
