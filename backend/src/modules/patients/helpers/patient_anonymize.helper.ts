import { createHash } from 'node:crypto';

const ANON_PREFIX = 'ANON ';

export function isAnonymizedName(name: string): boolean {
  return name.startsWith(ANON_PREFIX);
}

function digest(patientId: string, field: string): string {
  return createHash('sha256').update(`${patientId}:${field}`).digest('hex');
}

/** Nome sintético com 2 palavras (invariante de cadastro). */
export function anonymizedName(patientId: string): string {
  return `${ANON_PREFIX}Titular-${digest(patientId, 'name').slice(0, 8)}`;
}

/** Telefone sentinela de 11 dígitos, determinístico. */
export function anonymizedPhone(patientId: string): string {
  const n = Number.parseInt(digest(patientId, 'phone').slice(0, 8), 16);
  return `00000${String(n % 1_000_000).padStart(6, '0')}`;
}
