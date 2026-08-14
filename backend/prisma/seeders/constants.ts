export const OWNER_EMAIL = 'owner@teste.local';
export const OWNER_PASSWORD = 'SenhaForte!99';
export const OWNER_NAME = 'Owner Teste';
export const CLINIC_NAME = 'Clínica Teste';

export const DENTIST_EMAIL = 'dentist@teste.local';
export const RECEPTION_EMAIL = 'recepcao@teste.local';
export const ASSISTANT_EMAIL = 'asb@teste.local';
export const FINANCE_EMAIL = 'financeiro@teste.local';
export const INVITE_EMAIL = 'auxiliar@teste.local';
export const SEED_PASSWORD = OWNER_PASSWORD;
export const INVITE_RAW_TOKEN = 'seed-invite-dev-token';

export const SEED_QUOTE_NOTES = '[seed] Orçamento Maria — RES-01 / PROF-01 / RAD-01';

export const BUSINESS_START = new Date('1970-01-01T08:00:00.000Z');
export const BUSINESS_END = new Date('1970-01-01T18:00:00.000Z');
export const WEEKDAYS = [1, 2, 3, 4, 5];

export const PRICED_PROCEDURES: Record<string, number> = {
  'CONS-01': 15000,
  'PROF-01': 18000,
  'RAD-01': 8000,
  'RES-01': 35000,
  'URG-01': 20000,
};
