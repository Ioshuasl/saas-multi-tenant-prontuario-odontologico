'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { ReportExportPanel } from '@/packages/admin/components/Report/ReportExportPanel';
import { adminErrorMessage } from '@/packages/admin/helpers/AdminErrorMessage';
import { formatCents } from '@/packages/admin/helpers/FormatCents';
import { useProceduresGetHook } from '@/packages/admin/hooks/Report/useProceduresGetHook';
import { useAuth } from '@/shared/auth/AuthProvider';
import { hasPermission } from '@/shared/auth/permissions';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Input } from '@/shared/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';

function monthRange(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { from, to };
}

export function ProceduresIndex() {
  const searchParams = useSearchParams();
  const { me } = useAuth();
  const canRead = hasPermission(me, 'reports.read');
  const initial = monthRange();
  const [from, setFrom] = useState(() => searchParams.get('from') ?? initial.from);
  const [to, setTo] = useState(() => searchParams.get('to') ?? initial.to);
  const report = useProceduresGetHook({ from, to }, canRead);

  if (!canRead) {
    return (
      <div className="grid gap-4">
        <h1 className="text-xl font-semibold">Procedimentos</h1>
        <Alert variant="destructive">
          <AlertDescription>Você não tem permissão para ver este relatório.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-1">
        <h1 className="text-xl font-semibold">Procedimentos</h1>
        <p className="text-sm text-muted-foreground">Produção agregada por procedimento.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          type="date"
          aria-label="De"
          className="w-40"
          value={from}
          onChange={(event) => setFrom(event.target.value)}
        />
        <Input
          type="date"
          aria-label="Até"
          className="w-40"
          value={to}
          onChange={(event) => setTo(event.target.value)}
        />
      </div>

      {report.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando procedimentos…</p>
      ) : report.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{adminErrorMessage(report.error)}</AlertDescription>
        </Alert>
      ) : report.data ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Procedimento</TableHead>
              <TableHead>Qtd.</TableHead>
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.data.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  Nenhum procedimento no período.
                </TableCell>
              </TableRow>
            ) : (
              report.data.items.map((item) => (
                <TableRow key={item.procedureId}>
                  <TableCell>{item.procedureCode}</TableCell>
                  <TableCell>{item.procedureName}</TableCell>
                  <TableCell>{item.count}</TableCell>
                  <TableCell>{formatCents(item.totalCents)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      ) : null}

      <ReportExportPanel defaultReport="procedures" />
    </div>
  );
}
