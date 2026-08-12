import { hashToken } from '../../../../shared/helpers/token_hash.js';
import { AuditAction, writeAuditLogSafe } from '../../../../shared/database/write_audit.js';
import {
  GetByHashRepository,
  RevokeTokenRepository,
} from '../../repositories/refresh_token/refresh_token.repository.js';
import { ListActiveByUserRepository } from '../../repositories/membership/membership.repository.js';

export class LogoutService {
  constructor(
    private readonly getByHash = new GetByHashRepository(),
    private readonly revokeToken = new RevokeTokenRepository(),
    private readonly listMemberships = new ListActiveByUserRepository(),
  ) {}

  async execute(
    rawRefreshToken: string | undefined,
    meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<{ ok: true }> {
    if (!rawRefreshToken) {
      return { ok: true };
    }

    const stored = await this.getByHash.execute(hashToken(rawRefreshToken));
    if (stored && !stored.revokedAt) {
      await this.revokeToken.execute(stored.id);
      const memberships = await this.listMemberships.execute(stored.userId);
      const tenantId = memberships[0]?.tenantId;
      if (tenantId) {
        await writeAuditLogSafe({
          tenantId,
          actorId: stored.userId,
          action: AuditAction.LOGOUT,
          resourceType: 'session',
          ipAddress: meta?.ipAddress,
          userAgent: meta?.userAgent,
        });
      }
    }

    return { ok: true };
  }
}
