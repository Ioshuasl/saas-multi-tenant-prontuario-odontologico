'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { adminErrorMessage } from '@/packages/admin/helpers/AdminErrorMessage';
import { formatCents } from '@/packages/admin/helpers/FormatCents';
import { isoDateOr, monthRangeIso } from '@/packages/admin/helpers/ReportPeriod';
import { useProcedureGetHook } from '@/packages/admin/hooks/Report/useProcedureGetHook';
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

export function ProcedureIndex() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando procedimentos…</p>}>
      <ProcedureIndexBody />
    </Suspense>
  );
}

function ProcedureIndexBody() {
  const searchParams = useSearchParams();
  const initial = monthRangeIso();
  const [from, setFrom] = useState(isoDateOr(searchParams.get('from'), initial.from));
  const [to, setTo] = useState(isoDateOr(searchParams.get('to'), initial.to));
  const report = useProcedureGetHook({ from, to });

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-xl font-semibold">Procedimentos</h1>
        <p className="text-sm text-muted-foreground">Mix de produção executada no período.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Input type="date" aria-label="De" className="w-40" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" aria-label="Até" className="w-40" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      {report.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando procedimentos…</p>
      ) : report.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{adminErrorMessage(report.error)}</AlertDescription>
        </Alert>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Procedimento</TableHead>
              <TableHead>Quantidade</TableHead>
              <TableHead>Executado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(report.data?.items ?? []).map((item) => (
              <TableRow key={item.procedureId}>
                <TableCell>{item.procedureName}</TableCell>
                <TableCell>{item.count}</TableCell>
                <TableCell>{formatCents(item.executedCents)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
