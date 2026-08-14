'use client';

import { useUsageGetHook } from '@/packages/messaging/hooks/Usage/useUsageGetHook';
import { Skeleton } from '@/shared/ui/skeleton';

type AccountUsageSectionProps = {
  enabled: boolean;
};

export function AccountUsageSection({ enabled }: AccountUsageSectionProps) {
  const usageQuery = useUsageGetHook(enabled);

  return (
    <section className="rounded-lg border p-4">
      <h2 className="text-sm font-semibold">Uso</h2>
      {!enabled ? (
        <p className="mt-2 text-sm text-muted-foreground">Conecte a conta para ver o volume enviado.</p>
      ) : usageQuery.isLoading ? (
        <Skeleton className="mt-3 h-16 w-full" />
      ) : usageQuery.data ? (
        <div className="mt-3 grid gap-2 text-sm">
          <p>
            Enviadas: <strong>{usageQuery.data.sent}</strong>
          </p>
          <p>
            Falhas: <strong>{usageQuery.data.failed}</strong>
          </p>
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">Sem dados de uso.</p>
      )}
    </section>
  );
}
