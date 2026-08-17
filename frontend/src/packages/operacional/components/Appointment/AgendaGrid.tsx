'use client';

import type { MouseEvent } from 'react';
import { AGENDA_NOTION } from '@/packages/operacional/helpers/AgendaNotionTokens';
import type { SlotMinutes } from '@/packages/operacional/helpers/AgendaNotionTokens';
import {
  buildSlotStart,
  dayLabel,
  formatHour,
  gridHeightPx,
  hoursAxis,
  snapMinutes,
  toYmd,
} from '@/packages/operacional/helpers/AgendaTime';
import { AgendaEventBlock } from '@/packages/operacional/components/Appointment/AgendaEventBlock';
import type { AppointmentSummary } from '@/packages/operacional/types/Appointment/AppointmentTypes';
import { cn } from '@/shared/helpers/utils';

type AgendaGridProps = {
  days: Date[];
  appointments: AppointmentSummary[];
  slotMinutes: SlotMinutes;
  showProfessional?: boolean;
  onSlotClick: (startsAt: Date, endsAt: Date) => void;
  onOpenAppointment: (appointment: AppointmentSummary) => void;
  onMoveOrResize: (input: {
    appointmentId: string;
    startsAt: string;
    endsAt: string;
  }) => void;
};

export function AgendaGrid({
  days,
  appointments,
  slotMinutes,
  showProfessional = false,
  onSlotClick,
  onOpenAppointment,
  onMoveOrResize,
}: AgendaGridProps) {
  const height = gridHeightPx();
  const hours = hoursAxis();

  const onColumnClick = (day: Date, e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const rawMinutes = y / AGENDA_NOTION.pxPerMinute;
    const snapped = snapMinutes(rawMinutes, slotMinutes);
    const startsAt = buildSlotStart(day, snapped);
    const endsAt = new Date(startsAt.getTime() + slotMinutes * 60000);
    onSlotClick(startsAt, endsAt);
  };

  return (
    <div
      className={cn(
        'overflow-auto rounded-md border border-border',
        AGENDA_NOTION.gridBg,
      )}
    >
      <div
        className="grid min-w-[720px]"
        style={{ gridTemplateColumns: `56px repeat(${days.length}, minmax(0, 1fr))` }}
      >
        <div className={cn('sticky top-0 z-20 border-b', AGENDA_NOTION.dayHeader)} />
        {days.map((day) => (
          <div
            key={toYmd(day)}
            className={cn(
              'sticky top-0 z-20 border-b border-l px-2 py-2 text-center text-xs font-medium capitalize text-foreground',
              AGENDA_NOTION.dayHeader,
            )}
          >
            {dayLabel(day)}
          </div>
        ))}

        <div className="relative border-r border-border" style={{ height }}>
          {hours.map((hour) => {
            const top =
              (hour.getHours() - AGENDA_NOTION.dayStartHour) * 60 * AGENDA_NOTION.pxPerMinute;
            return (
              <div
                key={hour.toISOString()}
                className="absolute right-1 -translate-y-1/2 text-[10px] text-muted-foreground"
                style={{ top }}
              >
                {formatHour(hour)}
              </div>
            );
          })}
        </div>

        {days.map((day) => {
          const ymd = toYmd(day);
          const dayEvents = appointments.filter((a) => toYmd(new Date(a.startsAt)) === ymd);
          return (
            <div
              key={ymd}
              className={cn(
                'relative border-l border-border',
                AGENDA_NOTION.slotHover,
                AGENDA_NOTION.transition,
              )}
              style={{ height }}
              onClick={(e) => onColumnClick(day, e)}
              role="gridcell"
              aria-label={`Agenda ${dayLabel(day)}`}
            >
              {hours.map((hour) => {
                const top =
                  (hour.getHours() - AGENDA_NOTION.dayStartHour) *
                  60 *
                  AGENDA_NOTION.pxPerMinute;
                return (
                  <div
                    key={`${ymd}-${hour.getHours()}`}
                    className={cn('pointer-events-none absolute inset-x-0 border-t', AGENDA_NOTION.hourLine)}
                    style={{ top }}
                  />
                );
              })}
              {dayEvents.map((appointment) => (
                <AgendaEventBlock
                  key={appointment.id}
                  appointment={appointment}
                  slotMinutes={slotMinutes}
                  showProfessional={showProfessional}
                  onOpen={onOpenAppointment}
                  onMoveOrResize={onMoveOrResize}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
