'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import {
  WAITLIST_STATUS_LABELS,
  type WaitlistStatus,
} from '@/packages/operacional/enum/Waitlist/WaitlistStatusEnum';
import { operacionalErrorMessage } from '@/packages/operacional/helpers/OperacionalErrorMessage';
import { useWaitlistDeleteHook } from '@/packages/operacional/hooks/Waitlist/useWaitlistDeleteHook';
import { useWaitlistListHook } from '@/packages/operacional/hooks/Waitlist/useWaitlistListHook';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Alert, AlertDescription } from '@/shared/ui/alert';

const WaitlistFormDialog = dynamic(
  () =>
    import('@/packages/operacional/components/Waitlist/WaitlistFormDialog').then(
      (mod) => mod.WaitlistFormDialog,
    ),
  { ssr: false },
);
const WaitlistOfferFormDialog = dynamic(
  () =>
    import('@/packages/operacional/components/Waitlist/WaitlistOfferFormDialog').then(
      (mod) => mod.WaitlistOfferFormDialog,
    ),
  { ssr: false },
);

type WaitlistPanelProps = {
  professionalId?: string;
};

function statusLabel(status: string): string {
  if (status in WAITLIST_STATUS_LABELS) {
    return WAITLIST_STATUS_LABELS[status as WaitlistStatus];
  }
  return status;
}

export function WaitlistPanel({ professionalId }: WaitlistPanelProps) {
  const listQuery = useWaitlistListHook();
  const remove = useWaitlistDeleteHook();
  const [createOpen, setCreateOpen] = useState(false);
  const [offerId, setOfferId] = useState<string | null>(null);

  const active = (listQuery.data ?? []).filter(
    (entry) => entry.status === 'WAITING' || entry.status === 'OFFERED',
  );

  return (
    <section className="rounded-lg border p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">Fila de espera</h2>
          <p className="text-xs text-muted-foreground">
            {active.length === 0 ? 'Fila vazia.' : `${active.length} na fila`}
          </p>
        </div>
        <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
          Adicionar
        </Button>
      </div>

      {listQuery.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{operacionalErrorMessage(listQuery.error)}</AlertDescription>
        </Alert>
      ) : null}

      {listQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando fila…</p>
      ) : active.length === 0 ? null : (
        <ul className="grid gap-2">
          {active.map((entry) => (
            <li
              key={entry.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <div className="grid gap-0.5">
                <span className="font-medium">{entry.patient?.name ?? 'Paciente'}</span>
                <span className="text-xs text-muted-foreground">
                  {entry.procedure?.name ?? 'Procedimento'}
                  {entry.professional?.name ? ` · ${entry.professional.name}` : ' · qualquer profissional'}
                  {entry.priority === 1 ? ' · urgente' : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={entry.status === 'OFFERED' ? 'default' : 'secondary'}>
                  {statusLabel(entry.status)}
                </Badge>
                {entry.status === 'WAITING' ? (
                  <Button type="button" size="sm" variant="outline" onClick={() => setOfferId(entry.id)}>
                    Oferecer
                  </Button>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={remove.isPending}
                  onClick={() => {
                    void remove.mutateAsync(entry.id);
                  }}
                >
                  Remover
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {remove.isError ? (
        <Alert variant="destructive" className="mt-2">
          <AlertDescription>{operacionalErrorMessage(remove.error)}</AlertDescription>
        </Alert>
      ) : null}

      {createOpen ? (
        <WaitlistFormDialog
          open
          professionalId={professionalId}
          onClose={() => setCreateOpen(false)}
        />
      ) : null}

      {offerId ? (
        <WaitlistOfferFormDialog
          open
          waitlistId={offerId}
          professionalId={professionalId}
          onClose={() => setOfferId(null)}
        />
      ) : null}
    </section>
  );
}
