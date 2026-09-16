'use client';

import { formatDateTimeInTz } from '@/packages/public/helpers/BookingTime';
import { Alert, AlertDescription } from '@/shared/ui/alert';

type BookingStepSuccessProps = {
  timezone: string;
  startsAt: string;
  professionalName?: string;
  requested: boolean;
};

export function BookingStepSuccess({
  timezone,
  startsAt,
  professionalName,
  requested,
}: BookingStepSuccessProps) {
  return (
    <div className="grid gap-3">
      <Alert>
        <AlertDescription>
          {requested
            ? 'Pedido de horário enviado. A clínica vai confirmar e o dentista define o atendimento.'
            : 'Horário agendado com sucesso.'}
        </AlertDescription>
      </Alert>
      <div className="rounded-lg border border-border p-4 text-sm">
        <p className="font-medium capitalize">{formatDateTimeInTz(startsAt, timezone)}</p>
        <p className="mt-1 text-muted-foreground">Consulta / avaliação</p>
        {professionalName ? <p className="text-muted-foreground">{professionalName}</p> : null}
      </div>
    </div>
  );
}
