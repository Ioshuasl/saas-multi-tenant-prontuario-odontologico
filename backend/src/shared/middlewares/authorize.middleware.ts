import type { NextFunction, Request, Response } from 'express';
import { AuditAction, writeAuditLogSafe } from '../database/write_audit.js';
import { AppError } from './error_handler.middleware.js';

export function authorize(...requiredPermissions: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      next(new AppError('UNAUTHENTICATED', 'Token de acesso ausente.', 401));
      return;
    }

    const granted = new Set(req.auth.permissions);
    const missing = requiredPermissions.filter((p) => !granted.has(p));

    if (missing.length > 0) {
      void writeAuditLogSafe({
        tenantId: req.auth.tenantId,
        actorId: req.auth.userId,
        action: AuditAction.PERMISSION_DENIED,
        resourceType: 'permission',
        ipAddress: req.ip,
        userAgent: req.header('user-agent') ?? undefined,
        metadata: {
          required: requiredPermissions,
          missing,
          path: req.originalUrl,
        },
      }).finally(() => {
        next(new AppError('FORBIDDEN', 'Permissão insuficiente para este recurso.', 403));
      });
      return;
    }

    next();
  };
}
