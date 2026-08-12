import { randomBytes } from 'node:crypto';
import { signAccessToken } from '../../../../shared/auth/jwt.js';
import { env } from '../../../../shared/config/env.js';
import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';
import { AuditAction, writeAuditLogSafe } from '../../../../shared/database/write_audit.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import { hashToken } from '../../../../shared/helpers/token_hash.js';
import type { Role as RoleType } from '../../enum/role/role.enum.js';
import { resolvePermissions, type PermissionOverrides } from '../../enum/role/permission.enum.js';
import { RefreshReuseError } from '../../models/errors/refresh_reuse.error.js';
import { ListActiveByUserRepository } from '../../repositories/membership/membership.repository.js';
import {
  CreateRepository as CreateRefreshTokenRepository,
  GetByHashRepository,
  RevokeFamilyRepository,
  RevokeTokenRepository,
} from '../../repositories/refresh_token/refresh_token.repository.js';
import type { AuthRefreshResult } from '../../types/auth.types.js';
import { addDays } from '../../helpers/slug.helper.js';
import { pickPreferredMembership } from './auth_session.service.js';

export class RefreshService {
  constructor(
    private readonly getByHash = new GetByHashRepository(),
    private readonly revokeToken = new RevokeTokenRepository(),
    private readonly revokeFamily = new RevokeFamilyRepository(),
    private readonly createRefreshToken = new CreateRefreshTokenRepository(),
    private readonly listMemberships = new ListActiveByUserRepository(),
  ) {}

  async execute(
    rawRefreshToken: string | undefined,
    meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<AuthRefreshResult & { refreshToken: string }> {
    if (!rawRefreshToken) {
      throw new AppError('UNAUTHENTICATED', 'Sessão inválida. Faça login novamente.', 401);
    }

    const tokenHash = hashToken(rawRefreshToken);
    const stored = await this.getByHash.execute(tokenHash);

    if (!stored) {
      throw new AppError('UNAUTHENTICATED', 'Sessão inválida. Faça login novamente.', 401);
    }

    const now = new Date();
    const memberships = await this.listMemberships.execute(stored.userId);

    if (stored.revokedAt || stored.replacedById) {
      await this.revokeFamily.execute(stored.userId, stored.familyId);
      const tenantId = memberships[0]?.tenantId;
      if (tenantId) {
        await writeAuditLogSafe({
          tenantId,
          actorId: stored.userId,
          action: AuditAction.REFRESH_REUSE_DETECTED,
          resourceType: 'session',
          ipAddress: meta?.ipAddress,
          userAgent: meta?.userAgent,
        });
      }
      throw new RefreshReuseError();
    }

    if (stored.expiresAt <= now) {
      await this.revokeToken.execute(stored.id);
      throw new AppError('UNAUTHENTICATED', 'Sessão expirada. Faça login novamente.', 401);
    }

    const membership =
      (stored.membershipId
        ? memberships.find((m) => m.id === stored.membershipId)
        : undefined) ?? pickPreferredMembership(memberships);

    if (!membership) {
      throw new AppError('UNAUTHENTICATED', 'Sessão inválida. Faça login novamente.', 401);
    }

    const permissions = resolvePermissions(
      membership.role as RoleType,
      membership.permissions as PermissionOverrides,
    );

    const newRefreshToken = randomBytes(32).toString('base64url');
    const newRefreshTokenId = idGenerator.next();

    await this.revokeToken.execute(stored.id, newRefreshTokenId);

    await this.createRefreshToken.execute({
      id: newRefreshTokenId,
      userId: stored.userId,
      membershipId: membership.id,
      familyId: stored.familyId,
      tokenHash: hashToken(newRefreshToken),
      expiresAt: addDays(now, env.REFRESH_TOKEN_TTL_DAYS),
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    const accessToken = await signAccessToken({
      userId: stored.userId,
      tenantId: membership.tenantId,
      membershipId: membership.id,
      role: membership.role,
      permissions,
    });

    return { accessToken, refreshToken: newRefreshToken };
  }
}
