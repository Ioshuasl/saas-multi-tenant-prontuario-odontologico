import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';
import { resolvePermissions, type PermissionOverrides } from '../../enum/role/permission.enum.js';
import type { Role } from '../../enum/role/role.enum.js';
import { ListActiveByUserRepository } from '../../repositories/membership/membership.repository.js';
import { GetByIdRepository } from '../../repositories/user/user.repository.js';
import type { AuthMeResult } from '../../types/auth.types.js';

export class MeService {
  constructor(
    private readonly getUser = new GetByIdRepository(),
    private readonly listMemberships = new ListActiveByUserRepository(),
  ) {}

  async execute(ctx: RequestContext): Promise<AuthMeResult> {
    const user = await this.getUser.execute(ctx.userId);
    if (!user) {
      throw new AppError('UNAUTHENTICATED', 'Token de acesso inválido ou expirado.', 401);
    }

    const memberships = await this.listMemberships.execute(user.id);
    const current =
      memberships.find((m) => m.id === ctx.membershipId) ??
      memberships.find((m) => m.tenantId === ctx.tenantId) ??
      memberships[0];

    if (!current) {
      throw new AppError('UNAUTHENTICATED', 'Token de acesso inválido ou expirado.', 401);
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      memberships: memberships.map((m) => ({
        id: m.id,
        tenantId: m.tenantId,
        role: m.role,
        active: m.active,
        permissions: resolvePermissions(m.role as Role, m.permissions as PermissionOverrides),
        tenant: m.tenant,
      })),
      current: {
        tenantId: current.tenantId,
        membershipId: current.id,
        role: current.role,
        permissions: resolvePermissions(
          current.role as Role,
          current.permissions as PermissionOverrides,
        ),
      },
    };
  }
}
