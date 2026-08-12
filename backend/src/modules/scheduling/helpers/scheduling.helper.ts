import type { AppointmentSummary, AppointmentHistoryItem } from '../types/scheduling.types.js';

type AppointmentRow = {
  id: string;
  unitId: string;
  patientId: string;
  professionalId: string;
  chairId: string | null;
  procedureId: string | null;
  startsAt: Date;
  endsAt: Date;
  status: string;
  origin: string;
  notes: string | null;
  cancelReason: string | null;
  confirmedAt: Date | null;
  arrivedAt: Date | null;
  cancelledAt: Date | null;
  recurrenceId: string | null;
  createdAt: Date;
  updatedAt: Date;
  patient?: { id: string; name: string; phonePrimary: string };
  professional?: { id: string; membership?: { user?: { name: string } } | null };
  procedure?: { id: string; name: string; defaultMinutes: number } | null;
};

export function mapAppointment(row: AppointmentRow): AppointmentSummary {
  return {
    id: row.id,
    unitId: row.unitId,
    patientId: row.patientId,
    professionalId: row.professionalId,
    chairId: row.chairId,
    procedureId: row.procedureId,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    status: row.status,
    origin: row.origin,
    notes: row.notes,
    cancelReason: row.cancelReason,
    confirmedAt: row.confirmedAt?.toISOString() ?? null,
    arrivedAt: row.arrivedAt?.toISOString() ?? null,
    cancelledAt: row.cancelledAt?.toISOString() ?? null,
    recurrenceId: row.recurrenceId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    patient: row.patient
      ? {
          id: row.patient.id,
          name: row.patient.name,
          phonePrimary: row.patient.phonePrimary,
        }
      : undefined,
    professional: row.professional
      ? {
          id: row.professional.id,
          name: row.professional.membership?.user?.name ?? 'Profissional',
        }
      : undefined,
    procedure: row.procedure
      ? {
          id: row.procedure.id,
          name: row.procedure.name,
          defaultMinutes: row.procedure.defaultMinutes,
        }
      : null,
  };
}

export function mapHistory(row: {
  id: string;
  appointmentId: string;
  action: string;
  fromValue: unknown;
  toValue: unknown;
  actorId: string | null;
  actorType: string;
  createdAt: Date;
}): AppointmentHistoryItem {
  return {
    id: row.id,
    appointmentId: row.appointmentId,
    action: row.action,
    fromValue: row.fromValue,
    toValue: row.toValue,
    actorId: row.actorId,
    actorType: row.actorType,
    createdAt: row.createdAt.toISOString(),
  };
}

export function overlaps(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** Divide janela [start,end) em slots de duração fixa com passo `granularity`. */
export function splitWindow(
  windowStart: Date,
  windowEnd: Date,
  durationMs: number,
  stepMs: number,
): Array<{ startsAt: Date; endsAt: Date }> {
  const slots: Array<{ startsAt: Date; endsAt: Date }> = [];
  for (let t = windowStart.getTime(); t + durationMs <= windowEnd.getTime(); t += stepMs) {
    slots.push({
      startsAt: new Date(t),
      endsAt: new Date(t + durationMs),
    });
  }
  return slots;
}

/** YYYY-MM-DD no fuso informado. */
export function formatYmdInTz(instant: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);
  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  const d = parts.find((p) => p.type === 'day')?.value;
  return `${y}-${m}-${d}`;
}
