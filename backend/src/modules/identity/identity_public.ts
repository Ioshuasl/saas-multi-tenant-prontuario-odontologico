import { GetByUserAndTenantRepository } from './repositories/membership/membership.repository.js';
import { resolvePermissions, type PermissionOverrides } from './enum/role/permission.enum.js';
import type { Role } from './enum/role/role.enum.js';

export {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  resolvePermissions,
  type Permission,
  type PermissionOverrides,
} from './enum/role/permission.enum.js';

export { Role, ROLES, type Role as RoleEnum } from './enum/role/role.enum.js';

export type PublicMembership = {
  id: string;
  tenantId: string;
  role: string;
  permissions: string[];
};

const getByUserAndTenant = new GetByUserAndTenantRepository();

export async function findActiveMembership(
  userId: string,
  tenantId: string,
): Promise<PublicMembership | null> {
  const row = await getByUserAndTenant.execute(userId, tenantId);
  if (!row) return null;

  return {
    id: row.id,
    tenantId: row.tenantId,
    role: row.role,
    permissions: resolvePermissions(row.role as Role, row.permissions as PermissionOverrides),
  };
}
