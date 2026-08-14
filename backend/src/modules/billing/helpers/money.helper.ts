export function periodStartUtc(from: string): Date {
  return new Date(`${from}T00:00:00.000Z`);
}

export function periodEndExclusiveUtc(to: string): Date {
  const next = new Date(`${to}T00:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

export function toJsonCents(value: bigint): number {
  return Number(value);
}

export function dateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}
