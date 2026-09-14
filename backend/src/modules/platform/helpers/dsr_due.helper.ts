import { env } from '../../../shared/config/env.js';

export function dsrDueDays(): number {
  return env.DSR_DUE_DAYS;
}

export function computeDsrDueAt(requestedAt: Date, days = dsrDueDays()): Date {
  return new Date(requestedAt.getTime() + days * 24 * 60 * 60 * 1000);
}

export function todayInTimezone(timezone: string, now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function addCalendarDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const utc = Date.UTC(year ?? 1970, (month ?? 1) - 1, (day ?? 1) + days);
  const d = new Date(utc);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function formatDueDatePt(dueAt: Date, timezone: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: timezone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(dueAt);
}
