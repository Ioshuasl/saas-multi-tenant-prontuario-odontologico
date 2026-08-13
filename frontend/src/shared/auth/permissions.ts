import type { AuthMe } from '@/shared/auth/AuthTypes';

export function hasPermission(me: AuthMe | null | undefined, permission: string): boolean {
  return Boolean(me?.current.permissions.includes(permission));
}
