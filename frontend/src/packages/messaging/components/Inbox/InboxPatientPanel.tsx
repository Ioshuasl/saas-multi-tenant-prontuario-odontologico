'use client';

import Link from 'next/link';
import { messagingErrorMessage } from '@/packages/messaging/helpers/MessagingErrorMessage';
import { useInboxPatientContextHook } from '@/packages/messaging/hooks/Inbox/useInboxPatientContextHook';
import type { ConversationSummary } from '@/packages/messaging/types/Conversation/ConversationTypes';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';

type InboxPatientPanelProps = {
  conversation: ConversationSummary | null;
};

function formatAppointment(iso: string): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function InboxPatientPanel({ conversation }: InboxPatientPanelProps) {
  const patientId = conversation?.patientId ?? null;
  const contextQuery = useInboxPatientContextHook(patientId);

  if (!conversation) {
    return (
      <aside className="hidden h-full border-l p-4 2xl:block">
        <p className="text-sm text-muted-foreground">Contexto do paciente aparece aqui.</p>
      </aside>
    );
  }

  if (!patientId) {
    return (
      <aside className="hidden h-full border-l p-4 2xl:block">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Paciente</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <p className="font-medium">{conversation.contactName ?? 'Contato sem nome'}</p>
            <p className="text-muted-foreground">{conversation.contactPhone}</p>
            <p className="text-muted-foreground">
              Contato ainda não vinculado a um cadastro de paciente.
            </p>
          </CardContent>
        </Card>
      </aside>
    );
  }

  if (contextQuery.isLoading) {
    return (
      <aside className="hidden h-full border-l p-4 2xl:block">
        <Skeleton className="h-40 w-full" />
      </aside>
    );
  }

  if (contextQuery.isError) {
    return (
      <aside className="hidden h-full border-l p-4 2xl:block">
        <Alert variant="destructive">
          <AlertDescription>{messagingErrorMessage(contextQuery.error)}</AlertDescription>
        </Alert>
      </aside>
    );
  }

  const patient = contextQuery.data?.patient;
  const next = contextQuery.data?.nextAppointment;

  return (
    <aside className="hidden h-full min-h-0 border-l p-4 2xl:block">
      <Card className="sticky top-4">
        <CardHeader>
          <CardTitle className="text-base">Paciente</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm">
          <div className="grid gap-1">
            <p className="font-medium">{patient?.name ?? conversation.contactName ?? '—'}</p>
            <p className="text-muted-foreground">
              {patient?.phonePrimary ?? conversation.contactPhone}
            </p>
          </div>

          <div className="grid gap-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Próximo agendamento
            </p>
            {next ? (
              <>
                <p>{formatAppointment(next.startsAt)}</p>
                {next.professional?.name ? (
                  <p className="text-muted-foreground">{next.professional.name}</p>
                ) : null}
                {next.procedure?.name ? (
                  <p className="text-muted-foreground">{next.procedure.name}</p>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-1 w-fit"
                  nativeButton={false}
                  render={<Link href={`/app/agenda?appointmentId=${next.id}`} prefetch={false} />}
                >
                  Abrir na agenda
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground">Nenhum agendamento futuro.</p>
            )}
          </div>

          <Button
            type="button"
            variant="secondary"
            nativeButton={false}
            render={<Link href={`/app/pacientes/${patientId}`} prefetch={false} />}
          >
            Abrir ficha
          </Button>
        </CardContent>
      </Card>
    </aside>
  );
}
