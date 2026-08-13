/** Remove não-dígitos. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

/** Valida CPF (11 dígitos + dígitos verificadores). */
export function isValidCpf(raw: string): boolean {
  const cpf = digitsOnly(raw);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const calc = (base: string, factor: number): number => {
    let sum = 0;
    for (let i = 0; i < base.length; i += 1) {
      sum += Number(base[i]) * (factor - i);
    }
    const mod = (sum * 10) % 11;
    return mod === 10 ? 0 : mod;
  };

  const d1 = calc(cpf.slice(0, 9), 10);
  const d2 = calc(cpf.slice(0, 10), 11);
  return d1 === Number(cpf[9]) && d2 === Number(cpf[10]);
}

export function normalizeCpf(raw: string): string {
  return digitsOnly(raw).padStart(11, '0').slice(-11);
}

/** Telefone: só dígitos (mín. 10 para BR com DDD). */
export function normalizePhone(raw: string): string {
  return digitsOnly(raw);
}

/** E.164 BR (`55` + DDD + número). */
export function toE164Br(raw: string): string {
  const digits = digitsOnly(raw);
  if (digits.startsWith('55') && digits.length >= 12) return digits;
  if (digits.length >= 10 && digits.length <= 11) return `55${digits}`;
  return digits;
}

export function assertPatientName(name: string): void {
  const trimmed = name.trim().replace(/\s+/g, ' ');
  const words = trimmed.split(' ').filter(Boolean);
  if (trimmed.length < 3 || words.length < 2) {
    throw new Error('INVALID_NAME');
  }
}

export function isMinor(birthDateYmd: string | null | undefined, today = new Date()): boolean {
  if (!birthDateYmd) return false;
  const [y, m, d] = birthDateYmd.split('-').map(Number);
  if (!y || !m || !d) return false;
  const eighteenth = new Date(Date.UTC(y + 18, m - 1, d));
  return eighteenth > today;
}

export function toDateOnly(ymd: string): Date {
  return new Date(`${ymd}T00:00:00.000Z`);
}

export function formatDateOnly(value: Date | null): string | null {
  if (!value) return null;
  return value.toISOString().slice(0, 10);
}
