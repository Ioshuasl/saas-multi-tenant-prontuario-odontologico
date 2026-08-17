import { GetByUserAndTenantRepository } from './repositories/membership/membership.repository.js';
import { GetByIdRepository } from './repositories/user/user.repository.js';
import { resolvePermissions, type PermissionOverrides } from './enum/role/permission.enum.js';
import type { Role } from './enum/role/role.enum.js';
import { platformOperatorEmails } from '../../shared/config/env.js';

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
const getUserById = new GetByIdRepository();

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

/** Operador de plataforma (coluna ou allowlist de e-mail). Sem membership no tenant alvo. */
export async function isPlatformOperator(userId: string): Promise<boolean> {
  const user = await getUserById.execute(userId);
  if (!user) return false;
  if (user.platformRole === 'OPERATOR') return true;
  return platformOperatorEmails().includes(user.email.toLowerCase());
}
