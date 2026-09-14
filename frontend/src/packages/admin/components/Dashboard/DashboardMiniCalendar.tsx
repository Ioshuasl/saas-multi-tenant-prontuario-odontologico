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
};

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function monthTitle(date: Date): string {
  const raw = format(date, "MMMM 'de' yyyy", { locale: ptBR });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function DashboardMiniCalendar({
  appointmentDates = [],
  selected,
  onSelectDay,
}: DashboardMiniCalendarProps) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const today = new Date();

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const appointmentSet = useMemo(() => new Set(appointmentDates), [appointmentDates]);

  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl border border-[#EBE4DE] bg-white p-3.5 shadow-[0_1px_2px_rgb(74_15_22/0.04)]">
      <header className="mb-2.5 flex shrink-0 items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <CalendarDaysIcon className="size-3.5 text-[#4A0F16]" strokeWidth={1.7} />
          <h2 className="font-sans text-[15px] font-semibold text-[#1A1A1A]">Calendário</h2>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            className="inline-flex size-7 items-center justify-center rounded-md text-[#7A716C] hover:bg-[#F3EEE9] hover:text-[#4A0F16]"
            aria-label="Mês anterior"
            onClick={() => setCursor((d) => subMonths(d, 1))}
          >
            <ChevronLeftIcon className="size-3.5" />
          </button>
          <p className="min-w-[7.5rem] text-center font-sans text-[13px] font-semibold text-[#1A1A1A]">
            {monthTitle(cursor)}
          </p>
          <button
            type="button"
            className="inline-flex size-7 items-center justify-center rounded-md text-[#7A716C] hover:bg-[#F3EEE9] hover:text-[#4A0F16]"
            aria-label="Próximo mês"
            onClick={() => setCursor((d) => addMonths(d, 1))}
          >
            <ChevronRightIcon className="size-3.5" />
          </button>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-7 content-evenly gap-y-1 text-center">
        {WEEKDAYS.map((day, index) => (
          <span
            key={`${day}-${index}`}
            className="py-0.5 text-[9px] font-semibold tracking-wide text-[#A39A94]"
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
                'relative mx-auto flex size-8 items-center justify-center rounded-full text-[12px] tabular-nums transition-colors',
                !inMonth && 'text-[#D5CDC6]',
                inMonth && !isToday && 'text-[#3A3330] hover:bg-[#F3EEE9]',
                isToday && 'bg-[#4A0F16] font-semibold text-white',
                selected && isSameDay(day, selected) && !isToday && 'ring-2 ring-[#4A0F16]/25',
              )}
            >
              {format(day, 'd')}
              {hasAppt && !isToday ? (
                <span className="absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-[#4A0F16]" />
              ) : null}
            </button>
          );
        })}
      </div>

      <ul className="mt-3 flex shrink-0 flex-wrap gap-x-3 gap-y-1 text-[10px] text-[#7A716C]">
        <li className="inline-flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-[#4A0F16]" />
          Atendimentos
        </li>
        <li className="inline-flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-[#C14C4A]" />
          Dia atual
        </li>
        <li className="inline-flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-[#D5CDC6]" />
          Feriado
        </li>
      </ul>
    </section>
  );
}
