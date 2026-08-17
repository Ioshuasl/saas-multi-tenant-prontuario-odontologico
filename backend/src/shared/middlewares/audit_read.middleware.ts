import type { NextFunction, Request, Response } from 'express';
import { AuditAction, writeAuditLogSafe } from '../database/write_audit.js';

type AuditReadOptions = {
  resourceType: string;
  patientIdParam?: string;
};

/**
 * Auditoria de leitura clínica (RF-E5-12). Grava após resposta 2xx.
 * Não bloqueia o request; falha de audit é ignorada.
 */
export function auditRead(options: AuditReadOptions) {
  const patientIdParam = options.patientIdParam ?? 'patientId';

  return (req: Request, res: Response, next: NextFunction): void => {
    res.on('finish', () => {
      if (res.statusCode < 200 || res.statusCode >= 300) return;
      if (!req.auth) return;

      const patientId = req.params[patientIdParam];
      void writeAuditLogSafe({
        tenantId: req.auth.tenantId,
        actorId: req.auth.userId,
        action: AuditAction.CLINICAL_READ,
        resourceType: options.resourceType,
        resourceId: patientId,
        patientId,
        ipAddress: req.ip,
        userAgent: req.header('user-agent') ?? undefined,
        metadata: { path: req.originalUrl, method: req.method },
      });
    });

    next();
  };
}
