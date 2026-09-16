'use client';

import { useMemo, useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { cn } from '@/shared/helpers/utils';

type DashboardMiniCalendarProps = {
  appointmentDates?: string[];
  selected?: Date;
  onSelectDay?: (day: Date) => void;
  onMonthChange?: (month: Date) => void;
};

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

function monthTitle(date: Date): string {
  const raw = format(date, "MMMM 'de' yyyy", { locale: ptBR });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function DashboardMiniCalendar({
  appointmentDates = [],
  selected,
  onSelectDay,
  onMonthChange,
}: DashboardMiniCalendarProps) {
  const [cursor, setCursor] = useState(() => startOfMonth(selected ?? new Date()));
  const today = new Date();

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const appointmentSet = useMemo(() => new Set(appointmentDates), [appointmentDates]);

  const goToMonth = (next: Date) => {
    const month = startOfMonth(next);
    setCursor(month);
    onMonthChange?.(month);
  };

  return (
    <section className="flex w-full shrink-0 flex-col overflow-hidden rounded-[14px] border border-border bg-card p-3.5 shadow-clivra-sm sm:p-4">
      <header className="mb-2.5 flex items-center gap-2">
        <CalendarDaysIcon className="size-4 text-primary" strokeWidth={1.6} />
        <h2 className="text-[15px] font-semibold text-primary">Calendário</h2>
      </header>

      <div className="mb-2.5 flex items-center justify-between gap-2">
        <button
          type="button"
          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-primary transition-colors hover:bg-muted"
          aria-label="Mês anterior"
          onClick={() => goToMonth(subMonths(cursor, 1))}
        >
          <ChevronLeftIcon className="size-4" strokeWidth={1.8} />
        </button>
        <p className="text-[13px] font-semibold text-foreground">{monthTitle(cursor)}</p>
        <button
          type="button"
          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-primary transition-colors hover:bg-muted"
          aria-label="Próximo mês"
          onClick={() => goToMonth(addMonths(cursor, 1))}
        >
          <ChevronRightIcon className="size-4" strokeWidth={1.8} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-0.5 text-center">
        {WEEKDAYS.map((day) => (
          <span
            key={day}
            className="py-1 text-[11px] font-medium text-muted-foreground"
          >
            {day}
          </span>
        ))}
        {days.map((day) => {
          const inMonth = isSameMonth(day, cursor);
          const isToday = isSameDay(day, today);
          const ymd = format(day, 'yyyy-MM-dd');
          const hasAppt = appointmentSet.has(ymd);

          return (
            <button
              key={ymd}
              type="button"
              disabled={!inMonth}
              onClick={() => onSelectDay?.(day)}
              className={cn(
                'relative mx-auto flex size-7 cursor-pointer items-center justify-center rounded-full text-[12px] tabular-nums transition-colors sm:size-8 sm:text-[13px]',
                !inMonth && 'cursor-default text-muted-foreground/40',
                inMonth && !isToday && 'font-medium text-foreground hover:bg-muted',
                isToday && 'bg-primary font-semibold text-primary-foreground',
                selected &&
                  isSameDay(day, selected) &&
                  !isToday &&
                  'bg-primary/12 font-semibold text-primary ring-2 ring-primary/30',
              )}
            >
              {format(day, 'd')}
              {hasAppt && !isToday ? (
                <span className="absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-primary" />
              ) : null}
            </button>
          );
        })}
      </div>

      <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
        <li className="inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-primary" />
          Atendimentos
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-accent" />
          Dia atual
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-border" />
          Feriado
        </li>
      </ul>
    </section>
  );
}
