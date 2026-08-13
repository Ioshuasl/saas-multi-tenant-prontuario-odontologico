export type E2eUser = {
  email: string;
  password: string;
  name: string;
};

export const OWNER: E2eUser = {
  email: 'owner@teste.local',
  password: 'SenhaForte!99',
  name: 'Owner Teste',
};

export const DENTIST: E2eUser = {
  email: 'dentist@teste.local',
  password: 'SenhaForte!99',
  name: 'Dra. Ana Souza',
};

export const RECEPTION: E2eUser = {
  email: 'recepcao@teste.local',
  password: 'SenhaForte!99',
  name: 'Carla Recepção',
};

export const SEED_CLINIC = 'Clínica Teste';
export const SEED_PATIENT = 'Maria Silva';
export const SEED_CHAIR = 'Cadeira 1';
