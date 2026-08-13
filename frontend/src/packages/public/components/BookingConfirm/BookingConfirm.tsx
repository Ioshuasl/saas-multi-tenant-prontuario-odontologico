'use client';

import { AuthCard } from '@/packages/public/components/Auth/AuthCard';
import { formatDateTimeInTz } from '@/packages/public/helpers/BookingTime';
import { publicErrorMessage } from '@/packages/public/helpers/PublicErrorMessage';
import { useBookingConfirmGetHook } from '@/packages/public/hooks/BookingConfirm/useBookingConfirmGetHook';
import type { BookingConfirmProps } from '@/packages/public/types/BookingConfirm/BookingConfirmTypes';
import { ApiClientError } from '@/shared/api/api-client';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Skeleton } from '@/shared/ui/skeleton';

export function BookingConfirm({ token }: BookingConfirmProps) {
  const confirmQuery = useBookingConfirmGetHook(token);

  if (!token) {
    return (
      <AuthCard title="Confirmar consulta">
        <Alert variant="destructive">
          <AlertDescription>Link inválido ou expirado.</AlertDescription>
        </Alert>
      </AuthCard>
    );
  }

  if (confirmQuery.isLoading) {
    return (
      <AuthCard title="Confirmar consulta" description="Validando o link…">
        <Skeleton className="h-16 w-full" />
      </AuthCard>
    );
  }

  if (confirmQuery.isError || !confirmQuery.data) {
    const notFound = confirmQuery.error instanceof ApiClientError && confirmQuery.error.status === 404;
    return (
      <AuthCard title="Confirmar consulta">
        <Alert variant="destructive">
          <AlertDescription>
            {notFound ? 'Link inválido ou expirado.' : publicErrorMessage(confirmQuery.error)}
          </AlertDescription>
        </Alert>
      </AuthCard>
    );
  }

  const appointment = confirmQuery.data;

  return (
    <AuthCard title="Consulta confirmada" description="Sua presença está confirmada.">
      <Alert>
        <AlertDescription>Consulta confirmada.</AlertDescription>
      </Alert>
      <p className="mt-3 text-sm capitalize text-muted-foreground">
        {formatDateTimeInTz(appointment.startsAt, 'America/Sao_Paulo')}
      </p>
      {appointment.procedure?.name ? (
        <p className="text-sm text-muted-foreground">{appointment.procedure.name}</p>
      ) : null}
      {appointment.professional?.name ? (
        <p className="text-sm text-muted-foreground">{appointment.professional.name}</p>
      ) : null}
    </AuthCard>
  );
}
