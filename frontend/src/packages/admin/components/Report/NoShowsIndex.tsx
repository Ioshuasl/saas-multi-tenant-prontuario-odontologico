'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { ReportExportPanel } from '@/packages/admin/components/Report/ReportExportPanel';
import { adminErrorMessage } from '@/packages/admin/helpers/AdminErrorMessage';
import { formatCents } from '@/packages/admin/helpers/FormatCents';
import { useNoShowsGetHook } from '@/packages/admin/hooks/Report/useNoShowsGetHook';
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

export function NoShowsIndex() {
  const searchParams = useSearchParams();
  const { me } = useAuth();
  const canFinancial = hasPermission(me, 'reports.financial');
  const initial = monthRange();
  const [from, setFrom] = useState(() => searchParams.get('from') ?? initial.from);
  const [to, setTo] = useState(() => searchParams.get('to') ?? initial.to);
  const report = useNoShowsGetHook({ from, to }, canFinancial);

  if (!canFinancial) {
    return (
      <div className="grid gap-4">
        <h1 className="text-xl font-semibold">Faltas</h1>
        <Alert variant="destructive">
          <AlertDescription>Relatório financeiro indisponível para o seu perfil.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-1">
        <h1 className="text-xl font-semibold">Faltas</h1>
        <p className="text-sm text-muted-foreground">No-shows e cancelamentos no período.</p>
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
        <p className="text-sm text-muted-foreground">Carregando faltas…</p>
      ) : report.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{adminErrorMessage(report.error)}</AlertDescription>
        </Alert>
      ) : report.data ? (
        <>
          <dl className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">Faltas</dt>
              <dd className="font-medium">{report.data.noShowCount}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Cancelamentos</dt>
              <dd className="font-medium">{report.data.cancelledCount}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Perda estimada</dt>
              <dd className="font-medium">{formatCents(report.data.estimatedLossCents)}</dd>
            </div>
          </dl>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Profissional</TableHead>
                <TableHead>Procedimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Perda</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.data.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    Nenhuma falta no período.
                  </TableCell>
                </TableRow>
              ) : (
                report.data.items.map((item) => (
                  <TableRow key={item.appointmentId}>
                    <TableCell>#{item.patientCode}</TableCell>
                    <TableCell>{item.professionalName}</TableCell>
                    <TableCell>{item.procedureName ?? '—'}</TableCell>
                    <TableCell>{item.status}</TableCell>
                    <TableCell>{formatCents(item.estimatedLossCents)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </>
      ) : null}

      <ReportExportPanel defaultReport="no-shows" />
    </div>
  );
}
