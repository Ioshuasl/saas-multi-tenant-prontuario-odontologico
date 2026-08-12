export const Role = {
  OWNER: 'OWNER',
  DENTIST: 'DENTIST',
  RECEPTION: 'RECEPTION',
  ASSISTANT: 'ASSISTANT',
  FINANCE: 'FINANCE',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const ROLES = Object.values(Role);
