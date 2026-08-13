import type { WaitlistPreferredPeriod, WaitlistSummary } from '../types/waitlist.types.js';

export const WAITLIST_OFFER_TTL_MS = 30 * 60_000;
export const WAITLIST_OFFER_BATCH_SIZE = 3;
export const WAITLIST_OFFER_MAX_BATCHES = 3;

type WaitlistRow = {
  id: string;
  unitId: string;
  patientId: string;
  professionalId: string | null;
  procedureId: string | null;
  preferredPeriods: unknown;
  priority: number;
  status: string;
  offeredAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  patient?: { id: string; name: string; phonePrimary: string };
  professional?: { id: string; membership?: { user?: { name: string } | null } | null } | null;
  procedure?: { id: string; name: string; defaultMinutes: number } | null;
};

export function parsePreferredPeriods(raw: unknown): WaitlistPreferredPeriod[] {
  if (!Array.isArray(raw)) return [];
  const periods: WaitlistPreferredPeriod[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const value = item as Record<string, unknown>;
    const weekday = Number(value.weekday);
    const from = typeof value.from === 'string' ? value.from : '';
    const to = typeof value.to === 'string' ? value.to : '';
    if (weekday >= 1 && weekday <= 7 && /^\d{2}:\d{2}$/.test(from) && /^\d{2}:\d{2}$/.test(to)) {
      periods.push({ weekday, from, to });
    }
  }
  return periods;
}

export function mapWaitlist(row: WaitlistRow): WaitlistSummary {
  return {
    id: row.id,
    unitId: row.unitId,
    patientId: row.patientId,
    professionalId: row.professionalId,
    procedureId: row.procedureId,
    preferredPeriods: parsePreferredPeriods(row.preferredPeriods),
    priority: row.priority,
    status: row.status,
    offeredAt: row.offeredAt?.toISOString() ?? null,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    patient: row.patient
      ? { id: row.patient.id, name: row.patient.name, phonePrimary: row.patient.phonePrimary }
      : undefined,
    professional: row.professional
      ? {
          id: row.professional.id,
          name: row.professional.membership?.user?.name ?? 'Profissional',
        }
      : null,
    procedure: row.procedure
      ? {
          id: row.procedure.id,
          name: row.procedure.name,
          defaultMinutes: row.procedure.defaultMinutes,
        }
      : null,
  };
}

export function isoWeekdayInTz(instant: Date, timeZone: string): number {
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(instant);
  const map: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7,
  };
  return map[weekday] ?? 1;
}

export function hmInTz(instant: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant);
  const hour = parts.find((p) => p.type === 'hour')?.value ?? '00';
  const minute = parts.find((p) => p.type === 'minute')?.value ?? '00';
  return `${hour}:${minute}`;
}

export function matchesPreferredPeriods(
  startsAt: Date,
  periods: WaitlistPreferredPeriod[],
  timeZone: string,
): boolean {
  if (periods.length === 0) return true;
  const weekday = isoWeekdayInTz(startsAt, timeZone);
  const hm = hmInTz(startsAt, timeZone);
  return periods.some((p) => p.weekday === weekday && hm >= p.from && hm < p.to);
}

export function waitlistOfferButtonPayload(waitlistEntryId: string): string {
  return `WAITLIST_${waitlistEntryId}`;
}
