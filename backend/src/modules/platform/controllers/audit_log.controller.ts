import type { Request, Response } from 'express';
import { AppError } from '../../../shared/middlewares/error_handler.middleware.js';
import { auditLogListQuerySchema } from '../schemas/audit_log.schema.js';
import { ListService } from '../services/audit_log/audit_log_list.service.js';

function requireCtx(req: Request) {
  if (!req.ctx) {
    throw new AppError('UNAUTHENTICATED', 'Token de acesso ausente.', 401);
  }
  return req.ctx;
}

export class AuditLogController {
  constructor(private readonly listLogs = new ListService()) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const ctx = requireCtx(req);
    const parsed = auditLogListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Dados inválidos.', 400, parsed.error);
    }
    const result = await this.listLogs.execute(ctx, parsed.data);
    res.status(200).json({ data: result });
  };
}
