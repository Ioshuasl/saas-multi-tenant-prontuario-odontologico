'use client';

import { useMemo, useState } from 'react';
import {
  formatDateLongInTz,
  formatTimeInTz,
} from '@/packages/public/helpers/BookingTime';
import type { BookingAvailabilityDay } from '@/packages/public/types/Booking/BookingTypes';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

type BookingStepSlotProps = {
  timezone: string;
  days: BookingAvailabilityDay[];
  loading: boolean;
  errorMessage?: string | null;
  slotAlert?: string | null;
  suggestedSlots?: string[];
  selectedStartsAt: string;
  canGoBackRange: boolean;
  onSelect: (startsAt: string) => void;
  onPrevRange: () => void;
  onNextRange: () => void;
  onRetry: () => void;
  onBack: () => void;
  onContinue: () => void;
};

export function BookingStepSlot({
  timezone,
  days,
  loading,
  errorMessage,
  slotAlert,
  suggestedSlots = [],
  selectedStartsAt,
  canGoBackRange,
  onSelect,
  onPrevRange,
  onNextRange,
  onRetry,
  onBack,
  onContinue,
}: BookingStepSlotProps) {
  const daysWithSlots = useMemo(
    () =>
      days.map((day) => ({
        ...day,
        openSlots: day.slots.filter((slot) => slot.available),
      })),
    [days],
  );
  const [selectedDay, setSelectedDay] = useState('');
  const activeDay =
    daysWithSlots.find((day) => day.date === selectedDay) ??
    daysWithSlots.find((day) => day.openSlots.length > 0) ??
    daysWithSlots[0];
  const openSlots = activeDay?.openSlots ?? [];

  if (loading) {
    return (
      <div className="grid gap-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <>
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
        <Button type="button" size="lg" className="w-full" onClick={onRetry}>
          Tentar novamente
        </Button>
        <Button type="button" variant="ghost" className="w-full" onClick={onBack}>
          Voltar
        </Button>
      </>
    );
  }

  return (
    <>
      {slotAlert ? (
        <Alert variant="destructive">
          <AlertDescription>{slotAlert}</AlertDescription>
        </Alert>
      ) : null}

      {suggestedSlots.length > 0 ? (
        <div className="grid gap-2">
          <p className="text-sm font-medium">Horários sugeridos</p>
          <div className="flex flex-wrap gap-2">
            {suggestedSlots.map((iso) => (
              <Button
                key={iso}
                type="button"
                size="sm"
                variant={selectedStartsAt === iso ? 'default' : 'outline'}
                onClick={() => onSelect(iso)}
              >
                {formatTimeInTz(iso, timezone)}
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="outline" size="sm" disabled={!canGoBackRange} onClick={onPrevRange}>
          Dias anteriores
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onNextRange}>
          Próximos dias
        </Button>
      </div>

      {daysWithSlots.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum horário disponível neste período.</p>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {daysWithSlots.map((day) => (
              <Button
                key={day.date}
                type="button"
                size="sm"
                variant={activeDay?.date === day.date ? 'default' : 'outline'}
                className="shrink-0"
                onClick={() => setSelectedDay(day.date)}
              >
                <span className="flex flex-col items-start">
                  <span>{formatDateLongInTz(day.date, timezone)}</span>
                  <span className="text-xs opacity-80">{day.openSlots.length} horários</span>
                </span>
              </Button>
            ))}
          </div>

          {openSlots.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma consulta neste dia.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {openSlots.map((slot) => (
                <Button
                  key={slot.startsAt}
                  type="button"
                  variant={selectedStartsAt === slot.startsAt ? 'default' : 'outline'}
                  onClick={() => onSelect(slot.startsAt)}
                >
                  {formatTimeInTz(slot.startsAt, timezone)}
                </Button>
              ))}
            </div>
          )}
        </>
      )}

      <div className="grid gap-2">
        <Button type="button" size="lg" className="w-full" disabled={!selectedStartsAt} onClick={onContinue}>
          Continuar
        </Button>
        <Button type="button" variant="ghost" className="w-full" onClick={onBack}>
          Voltar
        </Button>
      </div>
    </>
  );
}
