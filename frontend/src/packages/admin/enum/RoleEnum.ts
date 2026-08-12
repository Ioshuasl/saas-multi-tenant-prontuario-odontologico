export const Role = {
  OWNER: 'OWNER',
  DENTIST: 'DENTIST',
  RECEPTION: 'RECEPTION',
  ASSISTANT: 'ASSISTANT',
  FINANCE: 'FINANCE',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const ROLES = Object.values(Role);

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: 'Proprietário',
  DENTIST: 'Dentista',
  RECEPTION: 'Recepção',
  ASSISTANT: 'Assistente',
  FINANCE: 'Financeiro',
};
