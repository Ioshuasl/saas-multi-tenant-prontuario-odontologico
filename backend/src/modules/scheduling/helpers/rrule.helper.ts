import { UnsupportedRruleError } from '../models/errors/scheduling.errors.js';

export type ParsedRrule = {
  freq: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  interval: number;
};

/** Subconjunto RRULE do MVP (RF-E4-10): FREQ + INTERVAL. */
export function parseRrule(rrule: string): ParsedRrule {
  const parts = Object.fromEntries(
    rrule
      .split(';')
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => {
        const eq = p.indexOf('=');
        if (eq < 0) return [p.toUpperCase(), ''];
        return [p.slice(0, eq).toUpperCase(), p.slice(eq + 1).toUpperCase()];
      }),
  ) as Record<string, string>;

  const freq = parts.FREQ;
  if (freq !== 'DAILY' && freq !== 'WEEKLY' && freq !== 'MONTHLY') {
    throw new UnsupportedRruleError();
  }

  const interval = parts.INTERVAL ? Number(parts.INTERVAL) : 1;
  if (!Number.isInteger(interval) || interval < 1 || interval > 52) {
    throw new UnsupportedRruleError('INTERVAL inválido.');
  }

  return { freq, interval };
}

/** Gera até `max` instantes a partir de `startsAt` (inclusive). */
export function expandOccurrences(
  startsAt: Date,
  rrule: string,
  max: number,
): Date[] {
  const { freq, interval } = parseRrule(rrule);
  const result: Date[] = [new Date(startsAt.getTime())];
  let cursor = startsAt;

  while (result.length < max) {
    const next = new Date(cursor.getTime());
    if (freq === 'DAILY') {
      next.setUTCDate(next.getUTCDate() + interval);
    } else if (freq === 'WEEKLY') {
      next.setUTCDate(next.getUTCDate() + 7 * interval);
    } else {
      next.setUTCMonth(next.getUTCMonth() + interval);
    }
    result.push(next);
    cursor = next;
  }

  return result;
}
