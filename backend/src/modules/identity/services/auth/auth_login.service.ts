import { verifyPasswordConstantTime } from '../../../../shared/helpers/password.js';
import { AuditAction, writeAuditLogSafe } from '../../../../shared/database/write_audit.js';
import { InvalidCredentialsError } from '../../models/errors/invalid_credentials.error.js';
import { isLocked, nextLockout } from '../../helpers/lockout.helper.js';
import {
  GetByEmailRepository,
  UpdateLastLoginRepository,
  UpdateLoginFailureRepository,
} from '../../repositories/user/user.repository.js';
import { ListActiveByUserRepository } from '../../repositories/membership/membership.repository.js';
import type { LoginSchema } from '../../schemas/auth.schema.js';
import type { AuthSessionResult } from '../../types/auth.types.js';
import { IssueTokensService, pickPreferredMembership } from './auth_session.service.js';
import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';

export class LoginService {
  constructor(
    private readonly getByEmail = new GetByEmailRepository(),
    private readonly updateLastLogin = new UpdateLastLoginRepository(),
    private readonly updateFailure = new UpdateLoginFailureRepository(),
    private readonly listMemberships = new ListActiveByUserRepository(),
    private readonly issueTokens = new IssueTokensService(),
  ) {}

  async execute(
    loginSchema: LoginSchema,
    meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<AuthSessionResult> {
    const email = loginSchema.email.toLowerCase();
    const user = await this.getByEmail.execute(email);
    const valid = await verifyPasswordConstantTime(
      loginSchema.password,
      user?.passwordHash,
    );

    if (user && isLocked(user.lockedUntil)) {
      await this.auditFailed(user.id, meta);
      throw new InvalidCredentialsError();
    }

    if (!user || !valid) {
      if (user) {
        const failedAttempts = user.failedAttempts + 1;
        await this.updateFailure.execute(
          user.id,
          failedAttempts,
          nextLockout(failedAttempts),
        );
        await this.auditFailed(user.id, meta);
      }
      throw new InvalidCredentialsError();
    }

    const memberships = await this.listMemberships.execute(user.id);
    const membership = pickPreferredMembership(memberships);

    if (!membership) {
      throw new AppError('UNAUTHENTICATED', 'Credenciais inválidas.', 401);
    }

    await this.updateLastLogin.execute(user.id);

    const session = await this.issueTokens.execute({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      membership,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    await writeAuditLogSafe({
      tenantId: membership.tenantId,
      actorId: user.id,
      action: AuditAction.LOGIN,
      resourceType: 'session',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return session;
  }

  private async auditFailed(
    userId: string,
    meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<void> {
    const memberships = await this.listMemberships.execute(userId);
    const tenantId = memberships[0]?.tenantId;
    if (!tenantId) return;
    await writeAuditLogSafe({
      tenantId,
      actorId: userId,
      action: AuditAction.LOGIN_FAILED,
      resourceType: 'session',
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });
  }
}
