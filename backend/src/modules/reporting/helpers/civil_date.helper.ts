export function todayInTimezone(timezone: string, now = new Date()): string {
  return formatYmdInTz(now, timezone);
}

export function formatYmdInTz(instant: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);
}

export function addDaysYmd(ymd: string, days: number): string {
  const utc = new Date(`${ymd}T00:00:00.000Z`);
  utc.setUTCDate(utc.getUTCDate() + days);
  return utc.toISOString().slice(0, 10);
}

export function monthStartYmd(ymd: string): string {
  return `${ymd.slice(0, 7)}-01`;
}

export function nextMonthStartYmd(ymd: string): string {
  const [yearRaw, monthRaw] = ymd.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const next = month === 12 ? Date.UTC(year + 1, 0, 1) : Date.UTC(year, month, 1);
  return new Date(next).toISOString().slice(0, 10);
}

export function monthEndYmd(ymd: string): string {
  return addDaysYmd(nextMonthStartYmd(ymd), -1);
}

export function diffDays(from: string, to: string): number {
  const start = Date.parse(`${from}T00:00:00.000Z`);
  const end = Date.parse(`${to}T00:00:00.000Z`);
  return Math.round((end - start) / 86_400_000);
}

export function civilDateUtc(ymd: string): Date {
  return new Date(`${ymd}T00:00:00.000Z`);
}

/** Início do dia civil no fuso (instante UTC). */
export function civilStartUtc(ymd: string, timezone: string): Date {
  return wallTimeToUtc(ymd, '00:00', timezone);
}

function wallTimeToUtc(dateYmd: string, hhmm: string, timeZone: string): Date {
  const [year, month, day] = dateYmd.split('-').map(Number);
  const [hour, minute] = hhmm.split(':').map(Number);
  if (!year || !month || !day || hour === undefined || minute === undefined) {
    throw new Error(`Horário inválido: ${dateYmd} ${hhmm}`);
  }

  const desiredAsUtcMs = Date.UTC(year, month - 1, day, hour, minute, 0);
  let guess = desiredAsUtcMs;

  for (let i = 0; i < 4; i += 1) {
    const local = zonedParts(guess, timeZone);
    const asLocalMs = Date.UTC(
      local.year,
      local.month - 1,
      local.day,
      local.hour,
      local.minute,
      local.second,
    );
    guess += desiredAsUtcMs - asLocalMs;
  }

  return new Date(guess);
}

function zonedParts(instantMs: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(instantMs));

  const read = (type: Intl.DateTimeFormatPartTypes): number => {
    const value = parts.find((part) => part.type === type)?.value;
    return Number(value);
  };

  let hour = read('hour');
  if (hour === 24) hour = 0;

  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    hour,
    minute: read('minute'),
    second: read('second'),
  };
}
