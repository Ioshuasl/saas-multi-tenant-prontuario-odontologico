/** Destinatário em audit: só últimos 4 dígitos (docs/17 §5.3). */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '****';
  return `****${digits.slice(-4)}`;
}

/** CPF em audit: nunca completo. */
export function maskCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length < 2) return '***.***.***-**';
  return `***.***.***-${digits.slice(-2)}`;
}
