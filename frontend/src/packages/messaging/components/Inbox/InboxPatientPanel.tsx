'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { CalendarDaysIcon, UserRoundIcon } from 'lucide-react';
import { messagingErrorMessage } from '@/packages/messaging/helpers/MessagingErrorMessage';
import { useInboxPatientContextHook } from '@/packages/messaging/hooks/Inbox/useInboxPatientContextHook';
import type { ConversationSummary } from '@/packages/messaging/types/Conversation/ConversationTypes';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
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

function PanelShell({ children }: { children: ReactNode }) {
  return (
    <aside
      className="flex h-full min-h-0 flex-col overflow-y-auto bg-card p-4"
      aria-label="Contexto do paciente"
    >
      {children}
    </aside>
  );
}

export function InboxPatientPanel({ conversation }: InboxPatientPanelProps) {
  const patientId = conversation?.patientId ?? null;
  const contextQuery = useInboxPatientContextHook(patientId);

  if (!conversation) {
    return (
      <PanelShell>
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <UserRoundIcon className="size-5" strokeWidth={1.6} aria-hidden />
          </span>
          <div className="grid gap-1">
            <p className="text-sm font-medium text-foreground">Paciente</p>
            <p className="text-[13px] text-muted-foreground">
              Abra uma conversa para ver a ficha e o próximo agendamento.
            </p>
          </div>
        </div>
      </PanelShell>
    );
  }

  if (!patientId) {
    return (
      <PanelShell>
        <h2 className="text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">
          Contato
        </h2>
        <div className="mt-3 grid gap-1">
          <p className="text-[15px] font-semibold text-foreground">
            {conversation.contactName ?? 'Sem nome'}
          </p>
          <p className="text-sm text-muted-foreground">{conversation.contactPhone}</p>
        </div>
        <p className="mt-4 text-[13px] leading-snug text-muted-foreground">
          Este número ainda não está vinculado a um paciente no Clivra.
        </p>
      </PanelShell>
    );
  }

  if (contextQuery.isLoading) {
    return (
      <PanelShell>
        <Skeleton className="h-36 w-full rounded-xl" />
      </PanelShell>
    );
  }

  if (contextQuery.isError) {
    return (
      <PanelShell>
        <Alert variant="destructive" role="alert">
          <AlertDescription>{messagingErrorMessage(contextQuery.error)}</AlertDescription>
        </Alert>
      </PanelShell>
    );
  }

  const patient = contextQuery.data?.patient;
  const next = contextQuery.data?.nextAppointment;

  return (
    <PanelShell>
      <h2 className="text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">
        Paciente
      </h2>

      <div className="mt-3 grid gap-1">
        <p className="text-[15px] font-semibold text-foreground">
          {patient?.name ?? conversation.contactName ?? '—'}
        </p>
        <p className="text-sm text-muted-foreground">
          {patient?.phonePrimary ?? conversation.contactPhone}
        </p>
      </div>

      <div className="mt-5 rounded-[12px] border border-border bg-muted/40 p-3">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          <CalendarDaysIcon className="size-3.5 text-primary" aria-hidden />
          Próximo agendamento
        </p>
        {next ? (
          <div className="mt-2 grid gap-1">
            <p className="text-sm font-medium text-foreground">
              {formatAppointment(next.startsAt)}
            </p>
            {next.professional?.name ? (
              <p className="text-[13px] text-muted-foreground">{next.professional.name}</p>
            ) : null}
            {next.procedure?.name ? (
              <p className="text-[13px] text-muted-foreground">{next.procedure.name}</p>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-2 w-fit cursor-pointer"
              nativeButton={false}
              render={<Link href={`/app/agenda?appointmentId=${next.id}`} prefetch={false} />}
            >
              Abrir na agenda
            </Button>
          </div>
        ) : (
          <p className="mt-2 text-[13px] text-muted-foreground">Nenhum agendamento futuro.</p>
        )}
      </div>

      <Button
        type="button"
        variant="secondary"
        className="mt-4 w-full cursor-pointer"
        nativeButton={false}
        render={<Link href={`/app/pacientes/${patientId}`} prefetch={false} />}
      >
        Abrir ficha do paciente
      </Button>
    </PanelShell>
  );
}
