/** Percentual máximo de desconto sobre o bruto (unit×qtd). `null` = ilimitado (OWNER). */
export function maxDiscountPercent(role: string | undefined): number | null {
  if (role === 'OWNER') return null;
  if (role === 'DENTIST') return 10;
  return 0;
}

export function allowedDiscountCents(grossCents: bigint, role: string | undefined): bigint | null {
  const percent = maxDiscountPercent(role);
  if (percent === null) return null;
  return (grossCents * BigInt(percent)) / 100n;
}
