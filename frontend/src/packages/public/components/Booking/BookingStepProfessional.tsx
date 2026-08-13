'use client';

import type { BookingProfessionalOption } from '@/packages/public/types/Booking/BookingTypes';
import { Button } from '@/shared/ui/button';

type BookingStepProfessionalProps = {
  professionals: BookingProfessionalOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  onBack: () => void;
  onContinue: () => void;
};

export function BookingStepProfessional({
  professionals,
  selectedId,
  onSelect,
  onBack,
  onContinue,
}: BookingStepProfessionalProps) {
  return (
    <>
      <ul className="grid gap-2">
        {professionals.map((professional) => (
          <li key={professional.id}>
            <Button
              type="button"
              variant={selectedId === professional.id ? 'default' : 'outline'}
              className="h-auto w-full justify-start py-3 text-left"
              onClick={() => onSelect(professional.id)}
            >
              {professional.name}
            </Button>
          </li>
        ))}
      </ul>
      <div className="grid gap-2">
        <Button type="button" size="lg" className="w-full" disabled={!selectedId} onClick={onContinue}>
          Continuar
        </Button>
        <Button type="button" variant="ghost" className="w-full" onClick={onBack}>
          Voltar
        </Button>
      </div>
    </>
  );
}
