import argon2 from 'argon2';
import { AppError } from '../middlewares/error_handler.middleware.js';

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 1,
} as const;

const COMMON_PASSWORDS = new Set([
  '123456',
  '123456789',
  '12345678',
  'password',
  'password1',
  'password123',
  'qwerty',
  'qwerty123',
  'abc123',
  '111111',
  '123123',
  'admin',
  'admin123',
  'letmein',
  'welcome',
  'welcome1',
  'monkey',
  'dragon',
  'master',
  'login',
  'princess',
  'football',
  'shadow',
  'sunshine',
  'iloveyou',
  'senha',
  'senha123',
  'clinica',
  'clinica123',
  'odontologia',
  'dentista',
]);

export function assertPasswordPolicy(password: string): void {
  if (password.length < 10) {
    throw new AppError(
      'VALIDATION_ERROR',
      'A senha deve ter no mínimo 10 caracteres.',
      400,
    );
  }

  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    throw new AppError(
      'BUSINESS_RULE_VIOLATION',
      'Esta senha é muito comum. Escolha outra.',
      422,
    );
  }
}

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return argon2.verify(hash, password);
}

/** Hash fictício gerado uma vez para equalizar tempo quando o usuário não existe. */
let dummyHashPromise: Promise<string> | undefined;

export async function getDummyPasswordHash(): Promise<string> {
  if (!dummyHashPromise) {
    dummyHashPromise = hashPassword('__dummy_constant_time__');
  }
  return dummyHashPromise;
}

export async function verifyPasswordConstantTime(
  password: string,
  hash: string | null | undefined,
): Promise<boolean> {
  const target = hash ?? (await getDummyPasswordHash());
  return verifyPassword(password, target);
}
