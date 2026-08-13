'use client';

import { useUsageGetHook } from '@/packages/messaging/hooks/Usage/useUsageGetHook';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Skeleton } from '@/shared/ui/skeleton';

type AccountUsageSectionProps = {
  enabled: boolean;
};

export function AccountUsageSection({ enabled }: AccountUsageSectionProps) {
  const usageQuery = useUsageGetHook(enabled);

  return (
    <section className="rounded-lg border p-4">
      <h2 className="text-sm font-semibold">Uso e créditos</h2>
      {!enabled ? (
        <p className="mt-2 text-sm text-muted-foreground">Conecte a conta para ver o consumo.</p>
      ) : usageQuery.isLoading ? (
        <Skeleton className="mt-3 h-16 w-full" />
      ) : usageQuery.data ? (
        <div className="mt-3 grid gap-2 text-sm">
          <p>
            Cortesia: <strong>{usageQuery.data.courtesyGranted}</strong>
          </p>
          <p>
            Consumido: <strong>{usageQuery.data.consumed}</strong>
          </p>
          <p>
            Saldo: <strong>{usageQuery.data.balance}</strong>
          </p>
          {usageQuery.data.creditsLow ? (
            <Alert>
              <AlertDescription>Créditos baixos. Automações de marketing podem pausar.</AlertDescription>
            </Alert>
          ) : null}
          {usageQuery.data.creditsExhausted ? (
            <Alert variant="destructive">
              <AlertDescription>
                Créditos esgotados. Mensagens transacionais da agenda continuam; marketing bloqueado.
              </AlertDescription>
            </Alert>
          ) : null}
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">Sem dados de uso.</p>
      )}
    </section>
  );
}
