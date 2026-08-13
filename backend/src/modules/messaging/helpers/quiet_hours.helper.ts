const QUIET_START_HOUR = 21;
const QUIET_END_HOUR = 8;

type CivilParts = { year: number; month: number; day: number; hour: number; minute: number };

function partsInTz(date: Date, timeZone: string): CivilParts {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const map = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
  };
}

function ymd(parts: Pick<CivilParts, 'year' | 'month' | 'day'>): string {
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

function addDaysYmd(value: string, days: number): string {
  const [year, month, day] = value.split('-').map(Number);
  const dt = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, (day ?? 1) + days));
  return dt.toISOString().slice(0, 10);
}

/** Converte civil local (YMD + hora) no fuso do tenant → Date UTC. */
export function fromZonedLocal(
  civilYmd: string,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const [y, m, d] = civilYmd.split('-').map(Number);
  const year = y ?? 1970;
  const month = m ?? 1;
  const day = d ?? 1;
  let utcMs = Date.UTC(year, month - 1, day, hour, minute, 0);
  for (let i = 0; i < 4; i += 1) {
    const got = partsInTz(new Date(utcMs), timeZone);
    const gotMs = Date.UTC(got.year, got.month - 1, got.day, got.hour, got.minute);
    const wantMs = Date.UTC(year, month - 1, day, hour, minute);
    utcMs += wantMs - gotMs;
  }
  return new Date(utcMs);
}

export function formatYmdInTz(date: Date, timeZone: string): string {
  return ymd(partsInTz(date, timeZone));
}

export function formatHmInTz(date: Date, timeZone: string): string {
  const parts = partsInTz(date, timeZone);
  return `${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`;
}

export function applyQuietHours(when: Date, timeZone: string): Date {
  const parts = partsInTz(when, timeZone);
  if (parts.hour >= QUIET_START_HOUR) {
    return fromZonedLocal(addDaysYmd(ymd(parts), 1), QUIET_END_HOUR, 0, timeZone);
  }
  if (parts.hour < QUIET_END_HOUR) {
    return fromZonedLocal(ymd(parts), QUIET_END_HOUR, 0, timeZone);
  }
  return when;
}

/** D-1 às 12:00 no fuso do tenant (quiet hours → 08:00). */
export function confirmationD1At(startsAt: Date, timeZone: string): Date {
  const dayBefore = addDaysYmd(formatYmdInTz(startsAt, timeZone), -1);
  return applyQuietHours(fromZonedLocal(dayBefore, 12, 0, timeZone), timeZone);
}

/** H-3 a partir de startsAt (quiet hours → 08:00). */
export function reminderH3At(startsAt: Date, timeZone: string): Date {
  return applyQuietHours(new Date(startsAt.getTime() - 3 * 60 * 60_000), timeZone);
}

export function delayMsFrom(when: Date, now = new Date()): number {
  return Math.max(0, when.getTime() - now.getTime());
}

export function notificationJobId(appointmentId: string, automationKey: string): string {
  return `${appointmentId}:${automationKey}`;
}
