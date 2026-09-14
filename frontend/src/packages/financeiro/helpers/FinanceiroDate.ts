export function todayIsoDate(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function addDaysIso(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T12:00:00`);
  date.setDate(date.getDate() + days);
  return todayIsoDate(date);
}

export function monthRangeIso(date = new Date()): { from: string; to: string } {
  const from = todayIsoDate(new Date(date.getFullYear(), date.getMonth(), 1));
  const to = todayIsoDate(new Date(date.getFullYear(), date.getMonth() + 1, 0));
  return { from, to };
}

export function formatIsoDayMonth(isoDate: string): string {
  const [, month, day] = isoDate.split('-');
  if (!month || !day) return isoDate;
  return `${day}/${month}`;
}

export function remainingCents(amountCents: number, paidCents: number): number {
  return Math.max(0, amountCents - paidCents);
}
