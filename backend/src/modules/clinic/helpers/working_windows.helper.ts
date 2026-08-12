export type TimeInterval = { startsAt: string; endsAt: string };

export type WorkingWindow = { startsAt: Date; endsAt: Date };

/** ISO weekday 1=Mon … 7=Sun for a civil YYYY-MM-DD date. */
export function isoWeekdayFromYmd(dateYmd: string): number {
  const [year, month, day] = dateYmd.split('-').map(Number);
  if (!year || !month || !day) {
    throw new Error(`Data inválida: ${dateYmd}`);
  }
  const utc = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = utc.getUTCDay();
  return dayOfWeek === 0 ? 7 : dayOfWeek;
}

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function zonedParts(instantMs: number, timeZone: string): ZonedParts {
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

/** Converte horário de parede (HH:mm) no fuso do tenant em instante UTC. */
export function wallTimeToUtc(dateYmd: string, hhmm: string, timeZone: string): Date {
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

export function intersectIntervals(a: TimeInterval[], b: TimeInterval[]): TimeInterval[] {
  const result: TimeInterval[] = [];
  for (const left of a) {
    for (const right of b) {
      const startsAt = left.startsAt > right.startsAt ? left.startsAt : right.startsAt;
      const endsAt = left.endsAt < right.endsAt ? left.endsAt : right.endsAt;
      if (startsAt < endsAt) {
        result.push({ startsAt, endsAt });
      }
    }
  }
  return mergeIntervals(result);
}

export function mergeIntervals(intervals: TimeInterval[]): TimeInterval[] {
  if (intervals.length === 0) return [];
  const sorted = [...intervals].sort((x, y) => x.startsAt.localeCompare(y.startsAt));
  const merged: TimeInterval[] = [{ ...sorted[0]! }];
  for (let i = 1; i < sorted.length; i += 1) {
    const current = sorted[i]!;
    const last = merged[merged.length - 1]!;
    if (current.startsAt <= last.endsAt) {
      if (current.endsAt > last.endsAt) last.endsAt = current.endsAt;
    } else {
      merged.push({ ...current });
    }
  }
  return merged;
}

export type ExceptionOverlay = {
  closed: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
};

/**
 * Exceções sobrepõem a grade semanal.
 * Qualquer `closed` zera o dia; exceções abertas substituem a grade.
 */
export function applyExceptionOverlays(
  weekly: TimeInterval[],
  exceptions: ExceptionOverlay[],
): TimeInterval[] {
  if (exceptions.length === 0) return weekly;
  if (exceptions.some((item) => item.closed)) return [];

  const open = exceptions.filter(
    (item) => !item.closed && item.startsAt && item.endsAt && item.startsAt < item.endsAt,
  );
  if (open.length === 0) return weekly;

  return mergeIntervals(
    open.map((item) => ({
      startsAt: item.startsAt!,
      endsAt: item.endsAt!,
    })),
  );
}

export function intervalsToUtcWindows(
  dateYmd: string,
  intervals: TimeInterval[],
  timeZone: string,
): WorkingWindow[] {
  return intervals.map((interval) => ({
    startsAt: wallTimeToUtc(dateYmd, interval.startsAt, timeZone),
    endsAt: wallTimeToUtc(dateYmd, interval.endsAt, timeZone),
  }));
}
