import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';
import { GetByUserAndTenantRepository } from '../../repositories/membership/membership.repository.js';
import { GetByIdRepository } from '../../repositories/user/user.repository.js';
import type { SwitchTenantSchema } from '../../schemas/auth.schema.js';
import type { AuthSessionResult } from '../../types/auth.types.js';
import { IssueTokensService } from './auth_session.service.js';

export class SwitchTenantService {
  constructor(
    private readonly getUser = new GetByIdRepository(),
    private readonly getMembership = new GetByUserAndTenantRepository(),
    private readonly issueTokens = new IssueTokensService(),
  ) {}

  async execute(
    ctx: RequestContext,
    switchTenantSchema: SwitchTenantSchema,
    meta?: { ipAddress?: string; userAgent?: string; familyId?: string },
  ): Promise<AuthSessionResult> {
    const membership = await this.getMembership.execute(
      ctx.userId,
      switchTenantSchema.tenantId,
    );
    if (!membership) {
      throw new AppError('TENANT_NOT_ALLOWED', 'Tenant não permitido para este usuário.', 403);
    }

    const user = await this.getUser.execute(ctx.userId);
    if (!user) {
      throw new AppError('UNAUTHENTICATED', 'Token de acesso inválido ou expirado.', 401);
    }

    return this.issueTokens.execute({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      membership,
      familyId: meta?.familyId,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });
  }
}
