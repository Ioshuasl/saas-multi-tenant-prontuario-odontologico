'use client';

import { useUsageGetHook } from '@/packages/messaging/hooks/Usage/useUsageGetHook';
import { ClivraSurface } from '@/shared/layout/ClivraPage';
import { Skeleton } from '@/shared/ui/skeleton';

type AccountUsageSectionProps = {
  enabled: boolean;
};

export function AccountUsageSection({ enabled }: AccountUsageSectionProps) {
  const usageQuery = useUsageGetHook(enabled);

  return (
    <ClivraSurface
      toolbar={<h2 className="text-sm font-semibold text-foreground">Uso</h2>}
      contentClassName="px-4 py-4"
    >
      {!enabled ? (
        <p className="text-sm text-muted-foreground">Conecte a conta para ver o volume enviado.</p>
      ) : usageQuery.isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : usageQuery.data ? (
        <div className="grid gap-2 text-sm">
          <p>
            Enviadas: <strong>{usageQuery.data.sent}</strong>
          </p>
          <p>
            Falhas: <strong>{usageQuery.data.failed}</strong>
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Sem dados de uso.</p>
      )}
    </ClivraSurface>
  );
}
