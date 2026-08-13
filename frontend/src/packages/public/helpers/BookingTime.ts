export function ymdInTimeZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function addDaysYmd(ymd: string, days: number): string {
  const parts = ymd.split('-');
  const year = Number(parts[0] ?? 1970);
  const month = Number(parts[1] ?? 1);
  const day = Number(parts[2] ?? 1);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  const yyyy = next.getUTCFullYear();
  const mm = String(next.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(next.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function formatTimeInTz(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function formatDateLongInTz(ymd: string, timeZone: string): string {
  const date = new Date(`${ymd}T12:00:00.000Z`);
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
}

export function formatDateTimeInTz(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}
