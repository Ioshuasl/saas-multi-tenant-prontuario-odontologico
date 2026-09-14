'use client';

import { timelineSourceLabel } from '@/packages/operacional/enum/Patient/TimelineSourceEnum';
import { operacionalErrorMessage } from '@/packages/operacional/helpers/OperacionalErrorMessage';
import { usePatientTimelineGetHook } from '@/packages/operacional/hooks/Patient/usePatientTimelineGetHook';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';

type PatientTimelineProps = {
  patientId: string;
};

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function PatientTimeline({ patientId }: PatientTimelineProps) {
  const timelineQuery = usePatientTimelineGetHook(patientId);

  if (timelineQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando timeline…</p>;
  }

  if (timelineQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{operacionalErrorMessage(timelineQuery.error)}</AlertDescription>
      </Alert>
    );
  }

  const data = timelineQuery.data;
  const items = data?.items ?? [];
  const includedSources = (data?.includedSources ?? []).map(timelineSourceLabel);

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <CardTitle>Linha do tempo</CardTitle>
        <CardDescription>
          Fontes: {includedSources.length > 0 ? includedSources.join(', ') : 'nenhuma'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum evento na timeline.</p>
        ) : (
          <ul className="grid gap-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="rounded-lg border border-border px-3 py-3 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-foreground">{item.title}</p>
                  <Badge variant="secondary">{timelineSourceLabel(item.source)}</Badge>
                </div>
                <p className="mt-1 text-muted-foreground">{formatWhen(item.occurredAt)}</p>
                {item.summary ? <p className="mt-1 text-foreground">{item.summary}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
