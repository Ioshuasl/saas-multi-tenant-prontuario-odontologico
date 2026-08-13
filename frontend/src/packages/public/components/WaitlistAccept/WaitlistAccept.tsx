'use client';

import { AuthCard } from '@/packages/public/components/Auth/AuthCard';
import { formatDateTimeInTz } from '@/packages/public/helpers/BookingTime';
import { publicErrorMessage } from '@/packages/public/helpers/PublicErrorMessage';
import { useWaitlistAcceptCreateHook } from '@/packages/public/hooks/WaitlistAccept/useWaitlistAcceptCreateHook';
import type { WaitlistAcceptProps } from '@/packages/public/types/WaitlistAccept/WaitlistAcceptTypes';
import { ApiClientError } from '@/shared/api/api-client';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';

export function WaitlistAccept({ token }: WaitlistAcceptProps) {
  const accept = useWaitlistAcceptCreateHook();

  if (!token) {
    return (
      <AuthCard title="Fila de espera">
        <Alert variant="destructive">
          <AlertDescription>Link inválido ou expirado.</AlertDescription>
        </Alert>
      </AuthCard>
    );
  }

  if (accept.isSuccess && accept.data) {
    return (
      <AuthCard title="Horário reservado" description="Sua consulta foi agendada pela fila de espera.">
        <Alert>
          <AlertDescription>Horário reservado com sucesso.</AlertDescription>
        </Alert>
        <p className="mt-3 text-sm capitalize text-muted-foreground">
          {formatDateTimeInTz(accept.data.appointment.startsAt, 'America/Sao_Paulo')}
        </p>
      </AuthCard>
    );
  }

  const notFound = accept.error instanceof ApiClientError && accept.error.status === 404;

  return (
    <AuthCard
      title="Fila de espera"
      description="Aceite este horário para ocupar a vaga. O primeiro a confirmar fica com a consulta."
    >
      {accept.isError ? (
        <Alert variant="destructive">
          <AlertDescription>
            {notFound ? 'Link inválido ou expirado.' : publicErrorMessage(accept.error)}
          </AlertDescription>
        </Alert>
      ) : null}

      <Button
        type="button"
        size="lg"
        className="mt-4 w-full"
        disabled={accept.isPending}
        onClick={() => {
          void accept.mutateAsync(token);
        }}
      >
        {accept.isPending ? 'Reservando…' : 'Aceitar horário'}
      </Button>
    </AuthCard>
  );
}
