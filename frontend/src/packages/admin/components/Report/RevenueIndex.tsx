'use client';

import { useState } from 'react';
import { ReportExportPanel } from '@/packages/admin/components/Report/ReportExportPanel';
import {
  REVENUE_GROUP_BYS,
  REVENUE_GROUP_BY_LABELS,
  type RevenueGroupBy,
} from '@/packages/admin/enum/Report/RevenueGroupByEnum';
import { adminErrorMessage } from '@/packages/admin/helpers/AdminErrorMessage';
import { formatCents } from '@/packages/admin/helpers/FormatCents';
import { useRevenueGetHook } from '@/packages/admin/hooks/Report/useRevenueGetHook';
import { useAuth } from '@/shared/auth/AuthProvider';
import { hasPermission } from '@/shared/auth/permissions';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Input } from '@/shared/ui/input';
import { NativeSelect, NativeSelectOption } from '@/shared/ui/native-select';
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

export function RevenueIndex() {
  const { me } = useAuth();
  const canFinancial = hasPermission(me, 'reports.financial');
  const initial = monthRange();
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [groupBy, setGroupBy] = useState<RevenueGroupBy>('day');
  const report = useRevenueGetHook({ from, to, groupBy }, canFinancial);

  if (!canFinancial) {
    return (
      <div className="grid gap-4">
        <h1 className="text-xl font-semibold">Receita</h1>
        <Alert variant="destructive">
          <AlertDescription>Relatório financeiro indisponível para o seu perfil.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-1">
        <h1 className="text-xl font-semibold">Receita</h1>
        <p className="text-sm text-muted-foreground">Pagamentos recebidos no período.</p>
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
        <NativeSelect
          aria-label="Agrupar por"
          className="w-52"
          value={groupBy}
          onChange={(event) => setGroupBy(event.target.value as RevenueGroupBy)}
        >
          {REVENUE_GROUP_BYS.map((item) => (
            <NativeSelectOption key={item} value={item}>
              {REVENUE_GROUP_BY_LABELS[item]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      {report.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando receita…</p>
      ) : report.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{adminErrorMessage(report.error)}</AlertDescription>
        </Alert>
      ) : report.data ? (
        <>
          <p className="text-sm">
            Total:{' '}
            <span className="font-semibold">{formatCents(report.data.totalCents)}</span>
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Período</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.data.buckets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground">
                    Sem receita no período.
                  </TableCell>
                </TableRow>
              ) : (
                report.data.buckets.map((bucket) => (
                  <TableRow key={bucket.key}>
                    <TableCell>{bucket.label}</TableCell>
                    <TableCell>{bucket.count}</TableCell>
                    <TableCell>{formatCents(bucket.amountCents)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </>
      ) : null}

      <ReportExportPanel defaultReport="revenue" />
    </div>
  );
}
