import { assertPasswordPolicy } from '../../../../shared/helpers/password.js';
import { hashToken } from '../../../../shared/helpers/token_hash.js';
import { AuditAction, writeAuditLogSafe } from '../../../../shared/database/write_audit.js';
import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';
import { ResetAction } from '../../actions/auth/auth_password_reset.action.js';
import { GetByHashRepository } from '../../repositories/password_reset/password_reset.repository.js';
import {
  GetByIdRepository,
} from '../../repositories/user/user.repository.js';
import { ListActiveByUserRepository } from '../../repositories/membership/membership.repository.js';
import type { PasswordResetSchema } from '../../schemas/auth.schema.js';

export class ResetService {
  constructor(
    private readonly getByHash = new GetByHashRepository(),
    private readonly getUser = new GetByIdRepository(),
    private readonly listMemberships = new ListActiveByUserRepository(),
    private readonly resetAction = new ResetAction(),
  ) {}

  async execute(
    passwordResetSchema: PasswordResetSchema,
    meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<{ ok: true }> {
    assertPasswordPolicy(passwordResetSchema.password);

    const stored = await this.getByHash.execute(hashToken(passwordResetSchema.token));
    if (!stored || stored.usedAt || stored.expiresAt <= new Date()) {
      throw new AppError('INVALID_STATE_TRANSITION', 'Token de redefinição inválido ou expirado.', 409);
    }

    const user = await this.getUser.execute(stored.userId);
    if (!user) {
      throw new AppError('INVALID_STATE_TRANSITION', 'Token de redefinição inválido ou expirado.', 409);
    }

    await this.resetAction.execute({
      tokenId: stored.id,
      userId: user.id,
      email: user.email,
      password: passwordResetSchema.password,
    });

    const memberships = await this.listMemberships.execute(user.id);
    const tenantId = memberships[0]?.tenantId;
    if (tenantId) {
      await writeAuditLogSafe({
        tenantId,
        actorId: user.id,
        action: AuditAction.PASSWORD_RESET,
        resourceType: 'user',
        resourceId: user.id,
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
      });
    }

    return { ok: true };
  }
}
