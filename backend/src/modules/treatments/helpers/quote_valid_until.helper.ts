export function addCalendarDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const utc = Date.UTC(year ?? 1970, (month ?? 1) - 1, (day ?? 1) + days);
  const d = new Date(utc);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function todayInTimezone(timezone: string, now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function defaultQuoteValidUntil(timezone: string, now = new Date()): string {
  return addCalendarDays(todayInTimezone(timezone, now), 30);
}

/** Instante UTC em que o fuso mostra `isoDate` 00:00. */
export function civilDateStartUtc(isoDate: string, timezone: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  const utcGuess = Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1, 12, 0, 0);
  const shown = todayInTimezone(timezone, new Date(utcGuess));
  const [sy, sm, sd] = shown.split('-').map(Number);
  const shownNoon = Date.UTC(sy ?? 1970, (sm ?? 1) - 1, sd ?? 1, 12, 0, 0);
  const driftDays = Math.round((shownNoon - utcGuess) / 86_400_000);
  const noonLocalAsUtc = utcGuess - driftDays * 86_400_000;
  const hourFmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const [hh, mm] = hourFmt.format(new Date(noonLocalAsUtc)).split(':').map(Number);
  const start = noonLocalAsUtc - ((hh ?? 12) * 60 + (mm ?? 0)) * 60_000;
  return new Date(start);
}

export function quoteTokenExpiresAt(validUntilIso: string, timezone: string): Date {
  return civilDateStartUtc(addCalendarDays(validUntilIso, 1), timezone);
}

export function isCivilDatePast(isoDate: string, timezone: string, now = new Date()): boolean {
  return todayInTimezone(timezone, now) > isoDate;
}
