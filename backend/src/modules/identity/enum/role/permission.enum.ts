import type { Role } from './role.enum.js';

export const PERMISSIONS = [
  'agenda.read',
  'agenda.write',
  'patients.read',
  'patients.write',
  'clinical_records.read',
  'clinical_records.write',
  'quotes.read',
  'quotes.write',
  'quotes.approve',
  'finance.read',
  'finance.write',
  'finance.close_cash',
  'messaging.read',
  'messaging.write',
  'messaging.configure',
  'reports.read',
  'reports.financial',
  'settings.read',
  'settings.write',
  'users.manage',
  'subscription.manage',
  'data.export',
  'audit.read',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  OWNER: PERMISSIONS,
  DENTIST: [
    'agenda.read',
    'agenda.write',
    'patients.read',
    'patients.write',
    'clinical_records.read',
    'clinical_records.write',
    'quotes.read',
    'quotes.write',
    'quotes.approve',
    'messaging.read',
    'messaging.write',
    'reports.read',
  ],
  RECEPTION: [
    'agenda.read',
    'agenda.write',
    'patients.read',
    'patients.write',
    'quotes.read',
    'quotes.write',
    'finance.read',
    'finance.write',
    'finance.close_cash',
    'messaging.read',
    'messaging.write',
    'reports.read',
  ],
  ASSISTANT: ['agenda.read', 'patients.read', 'clinical_records.read'],
  FINANCE: [
    'patients.read',
    'finance.read',
    'finance.write',
    'finance.close_cash',
    'reports.read',
    'reports.financial',
    'messaging.read',
    'messaging.write',
  ],
};

export type PermissionOverrides = {
  grant?: string[];
  revoke?: string[];
};

export function resolvePermissions(
  role: Role,
  overrides?: PermissionOverrides,
): string[] {
  const base = new Set<string>(ROLE_PERMISSIONS[role] ?? []);

  for (const perm of overrides?.grant ?? []) {
    base.add(perm);
  }

  for (const perm of overrides?.revoke ?? []) {
    base.delete(perm);
  }

  return [...base];
}
