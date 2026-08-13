'use client';

import { formatDateTimeInTz } from '@/packages/public/helpers/BookingTime';
import { Alert, AlertDescription } from '@/shared/ui/alert';

type BookingStepSuccessProps = {
  timezone: string;
  startsAt: string;
  procedureName?: string;
  professionalName?: string;
  requested: boolean;
};

export function BookingStepSuccess({
  timezone,
  startsAt,
  procedureName,
  professionalName,
  requested,
}: BookingStepSuccessProps) {
  return (
    <div className="grid gap-3">
      <Alert>
        <AlertDescription>
          {requested
            ? 'Pedido enviado. Aguarde a confirmação da clínica.'
            : 'Consulta agendada com sucesso.'}
        </AlertDescription>
      </Alert>
      <div className="rounded-lg border p-4 text-sm">
        <p className="font-medium capitalize">{formatDateTimeInTz(startsAt, timezone)}</p>
        {procedureName ? <p className="mt-1 text-muted-foreground">{procedureName}</p> : null}
        {professionalName ? <p className="text-muted-foreground">{professionalName}</p> : null}
      </div>
    </div>
  );
}
