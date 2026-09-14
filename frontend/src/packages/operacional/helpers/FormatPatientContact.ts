export function digitsOnly(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '');
}

/** Máscara de telefone BR: (11) 98888-0000 ou (11) 3333-4444 */
export function formatPhoneMask(phone: string | null | undefined): string {
  if (!phone) return '—';
  const digits = digitsOnly(phone);
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  if (digits.length > 0) return phone;
  return '—';
}

/** Máscara de CPF: 000.000.000-00 */
export function formatCpfMask(cpf: string | null | undefined): string {
  if (!cpf) return '—';
  const digits = digitsOnly(cpf);
  if (digits.length !== 11) return cpf;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}
