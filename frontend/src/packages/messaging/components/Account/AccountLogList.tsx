'use client';

import { useLogListHook } from '@/packages/messaging/hooks/Log/useLogListHook';
import { ClivraSurface } from '@/shared/layout/ClivraPage';
import { Skeleton } from '@/shared/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';

type AccountLogListProps = {
  enabled: boolean;
};

export function AccountLogList({ enabled }: AccountLogListProps) {
  const logsQuery = useLogListHook(enabled);
  const items = logsQuery.data?.items ?? [];

  return (
    <ClivraSurface
      toolbar={
        <div>
          <h2 className="text-sm font-semibold text-foreground">Logs de envio</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Resultado, template e horário — sem conteúdo clínico.
          </p>
        </div>
      }
      contentClassName="px-4 py-4"
    >
      {!enabled ? (
        <p className="text-sm text-muted-foreground">Conecte a conta para ver os logs.</p>
      ) : logsQuery.isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum envio registrado.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quando</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>Resultado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  {new Date(item.createdAt).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </TableCell>
                <TableCell>{item.templateKey ?? '—'}</TableCell>
                <TableCell>{item.result ?? item.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </ClivraSurface>
  );
}
