'use client';

import { operacionalErrorMessage } from '@/packages/operacional/helpers/OperacionalErrorMessage';
import { usePatientTimelineGetHook } from '@/packages/operacional/hooks/Patient/usePatientTimelineGetHook';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';

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

  return (
    <div className="grid max-w-2xl gap-4">
      <p className="text-sm text-muted-foreground">
        Fontes: {(data?.includedSources ?? []).join(', ') || 'nenhuma'}
      </p>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum evento na timeline.</p>
      ) : (
        <ul className="grid gap-2">
          {items.map((item) => (
            <li key={item.id} className="rounded-md border px-3 py-2 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{item.title}</p>
                <Badge variant="outline">{item.source}</Badge>
              </div>
              <p className="text-muted-foreground">{formatWhen(item.occurredAt)}</p>
              {item.summary ? <p>{item.summary}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
