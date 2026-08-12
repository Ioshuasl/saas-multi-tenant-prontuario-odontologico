import {
  addDays,
  addMinutes,
  differenceInMinutes,
  format,
  parseISO,
  startOfDay,
  startOfWeek,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AGENDA_NOTION } from '@/packages/operacional/helpers/AgendaNotionTokens';

export function toYmd(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function weekDays(anchor: Date): Date[] {
  const start = startOfWeek(anchor, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function dayLabel(date: Date): string {
  return format(date, "EEE d MMM", { locale: ptBR });
}

export function formatHour(date: Date): string {
  return format(date, 'HH:mm');
}

export function rangeIso(from: Date, to: Date): { from: string; to: string } {
  return { from: from.toISOString(), to: to.toISOString() };
}

export function weekRange(anchor: Date): { from: Date; to: Date } {
  const days = weekDays(anchor);
  const from = startOfDay(days[0]!);
  const to = addDays(startOfDay(days[6]!), 1);
  return { from, to };
}

export function dayRange(anchor: Date): { from: Date; to: Date } {
  const from = startOfDay(anchor);
  return { from, to: addDays(from, 1) };
}

/** Minutos desde dayStartHour no mesmo dia civil local. */
export function minutesFromGridStart(instant: Date): number {
  const start = new Date(instant);
  start.setHours(AGENDA_NOTION.dayStartHour, 0, 0, 0);
  return Math.max(0, differenceInMinutes(instant, start));
}

export function gridHeightPx(): number {
  const minutes =
    (AGENDA_NOTION.dayEndHour - AGENDA_NOTION.dayStartHour) * 60;
  return minutes * AGENDA_NOTION.pxPerMinute;
}

export function snapMinutes(value: number, slotMinutes: number): number {
  return Math.round(value / slotMinutes) * slotMinutes;
}

export function buildSlotStart(
  day: Date,
  minutesFromStart: number,
): Date {
  const base = startOfDay(day);
  base.setHours(AGENDA_NOTION.dayStartHour, 0, 0, 0);
  return addMinutes(base, minutesFromStart);
}

export function hoursAxis(): Date[] {
  const base = startOfDay(new Date());
  base.setHours(AGENDA_NOTION.dayStartHour, 0, 0, 0);
  const total = AGENDA_NOTION.dayEndHour - AGENDA_NOTION.dayStartHour;
  return Array.from({ length: total + 1 }, (_, i) => addMinutes(base, i * 60));
}

export function parseInstant(iso: string): Date {
  return parseISO(iso);
}
