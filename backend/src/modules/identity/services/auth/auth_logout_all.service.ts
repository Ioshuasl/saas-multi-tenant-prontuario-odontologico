import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';
import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AuditAction, writeAuditLogSafe } from '../../../../shared/database/write_audit.js';
import { RevokeAllFamiliesRepository } from '../../repositories/refresh_token/refresh_token.repository.js';

export class LogoutAllService {
  constructor(private readonly revokeAll = new RevokeAllFamiliesRepository()) {}

  async execute(
    ctx: RequestContext,
    meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<{ ok: true }> {
    if (!ctx.userId) {
      throw new AppError('UNAUTHENTICATED', 'Token de acesso ausente.', 401);
    }

    await this.revokeAll.execute(ctx.userId);
    await writeAuditLogSafe({
      tenantId: ctx.tenantId,
      actorId: ctx.userId,
      action: AuditAction.LOGOUT,
      resourceType: 'session',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      metadata: { scope: 'all' },
    });
    return { ok: true };
  }
}
