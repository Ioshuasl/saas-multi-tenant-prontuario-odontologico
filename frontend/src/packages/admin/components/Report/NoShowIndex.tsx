'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { adminErrorMessage } from '@/packages/admin/helpers/AdminErrorMessage';
import { formatCents } from '@/packages/admin/helpers/FormatCents';
import { isoDateOr, monthRangeIso } from '@/packages/admin/helpers/ReportPeriod';
import { useNoShowGetHook } from '@/packages/admin/hooks/Report/useNoShowGetHook';
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

export function NoShowIndex() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando faltas…</p>}>
      <NoShowIndexBody />
    </Suspense>
  );
}

function NoShowIndexBody() {
  const searchParams = useSearchParams();
  const initial = monthRangeIso();
  const [from, setFrom] = useState(isoDateOr(searchParams.get('from'), initial.from));
  const [to, setTo] = useState(isoDateOr(searchParams.get('to'), initial.to));
  const report = useNoShowGetHook({ from, to });

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-xl font-semibold">Faltas</h1>
        <p className="text-sm text-muted-foreground">No-shows e cancelamentos no período.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Input type="date" aria-label="De" className="w-40" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" aria-label="Até" className="w-40" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      {report.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando faltas…</p>
      ) : report.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{adminErrorMessage(report.error)}</AlertDescription>
        </Alert>
      ) : report.data ? (
        <>
          <p className="text-sm">
            Faltas: {report.data.noShowCount} · Cancelamentos: {report.data.cancelledCount} · Perda
            estimada: {formatCents(report.data.estimatedLossCents)}
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quando</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Profissional</TableHead>
                <TableHead>Procedimento</TableHead>
                <TableHead>Perda estimada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.data.items.map((item) => (
                <TableRow key={item.appointmentId}>
                  <TableCell>{item.startsAt.slice(0, 16).replace('T', ' ')}</TableCell>
                  <TableCell>{item.status}</TableCell>
                  <TableCell>{item.professionalName}</TableCell>
                  <TableCell>{item.procedureName ?? '—'}</TableCell>
                  <TableCell>{formatCents(item.estimatedLossCents)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      ) : null}
    </div>
  );
}
