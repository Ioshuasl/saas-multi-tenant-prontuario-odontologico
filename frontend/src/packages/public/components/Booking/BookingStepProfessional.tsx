'use client';

import type { BookingProfessionalOption } from '@/packages/public/types/Booking/BookingTypes';
import { BOOKING_ANY_PROFESSIONAL } from '@/packages/public/enum/Booking/BookingStepEnum';
import { Button } from '@/shared/ui/button';

type BookingStepProfessionalProps = {
  professionals: BookingProfessionalOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  onContinue: () => void;
};

export function BookingStepProfessional({
  professionals,
  selectedId,
  onSelect,
  onContinue,
}: BookingStepProfessionalProps) {
  const canContinue = Boolean(selectedId);

  return (
    <>
      <p className="text-[13px] leading-relaxed text-muted-foreground">
        O dentista define o atendimento na consulta. Aqui você só reserva o horário.
      </p>

      <ul className="grid gap-2">
        {professionals.length > 1 ? (
          <li>
            <Button
              type="button"
              variant={selectedId === BOOKING_ANY_PROFESSIONAL ? 'default' : 'outline'}
              className="h-auto min-h-11 w-full cursor-pointer justify-start py-3 text-left"
              onClick={() => onSelect(BOOKING_ANY_PROFESSIONAL)}
            >
              Qualquer profissional disponível
            </Button>
          </li>
        ) : null}
        {professionals.map((professional) => (
          <li key={professional.id}>
            <Button
              type="button"
              variant={selectedId === professional.id ? 'default' : 'outline'}
              className="h-auto min-h-11 w-full cursor-pointer justify-start py-3 text-left"
              onClick={() => onSelect(professional.id)}
            >
              {professional.name}
            </Button>
          </li>
        ))}
      </ul>

      <Button
        type="button"
        size="lg"
        className="w-full cursor-pointer"
        disabled={!canContinue}
        onClick={onContinue}
      >
        Continuar
      </Button>
    </>
  );
}
