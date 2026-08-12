import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { resolvePermissions, type PermissionOverrides } from '../../enum/role/permission.enum.js';
import type { Role } from '../../enum/role/role.enum.js';
import { ListByTenantRepository } from '../../repositories/membership/membership.repository.js';
import type { MemberSummary } from '../../types/auth.types.js';

export class ListService {
  constructor(private readonly listMemberships = new ListByTenantRepository()) {}

  async execute(ctx: RequestContext): Promise<MemberSummary[]> {
    const rows = await this.listMemberships.execute(ctx);
    return rows.map((row) => ({
      id: row.userId,
      membershipId: row.id,
      email: row.user?.email ?? '',
      name: row.user?.name ?? '',
      role: row.role,
      active: row.active,
      defaultUnitId: row.defaultUnitId ?? null,
      permissions: resolvePermissions(
        row.role as Role,
        row.permissions as PermissionOverrides,
      ),
    }));
  }
}
