'use client';

import type { BookingProcedureOption } from '@/packages/public/types/Booking/BookingTypes';
import { Button } from '@/shared/ui/button';

type BookingStepProcedureProps = {
  procedures: BookingProcedureOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  onContinue: () => void;
};

export function BookingStepProcedure({
  procedures,
  selectedId,
  onSelect,
  onContinue,
}: BookingStepProcedureProps) {
  if (procedures.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum serviço disponível para agendamento online.</p>;
  }

  return (
    <>
      <ul className="grid gap-2">
        {procedures.map((procedure) => (
          <li key={procedure.id}>
            <Button
              type="button"
              variant={selectedId === procedure.id ? 'default' : 'outline'}
              className="h-auto w-full justify-start py-3 text-left"
              onClick={() => onSelect(procedure.id)}
            >
              <span className="flex flex-col items-start gap-0.5">
                <span>{procedure.name}</span>
                <span className="text-xs opacity-80">{procedure.defaultMinutes} min</span>
              </span>
            </Button>
          </li>
        ))}
      </ul>
      <Button type="button" size="lg" className="w-full" disabled={!selectedId} onClick={onContinue}>
        Continuar
      </Button>
    </>
  );
}
