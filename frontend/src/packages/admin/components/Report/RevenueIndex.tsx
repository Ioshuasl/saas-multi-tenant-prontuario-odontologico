'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  REVENUE_GROUP_BY,
  REVENUE_GROUP_BY_LABELS,
  type RevenueGroupBy,
} from '@/packages/admin/enum/Report/RevenueGroupByEnum';
import { adminErrorMessage } from '@/packages/admin/helpers/AdminErrorMessage';
import { formatCents } from '@/packages/admin/helpers/FormatCents';
import { isoDateOr, monthRangeIso } from '@/packages/admin/helpers/ReportPeriod';
import { useRevenueGetHook } from '@/packages/admin/hooks/Report/useRevenueGetHook';
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

export function RevenueIndex() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando receita…</p>}>
      <RevenueIndexBody />
    </Suspense>
  );
}

function RevenueIndexBody() {
  const searchParams = useSearchParams();
  const initial = monthRangeIso();
  const [from, setFrom] = useState(isoDateOr(searchParams.get('from'), initial.from));
  const [to, setTo] = useState(isoDateOr(searchParams.get('to'), initial.to));
  const [groupBy, setGroupBy] = useState<RevenueGroupBy>('day');
  const report = useRevenueGetHook({ from, to, groupBy });

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-xl font-semibold">Receita</h1>
        <p className="text-sm text-muted-foreground">Recebimentos no período.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Input type="date" aria-label="De" className="w-40" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" aria-label="Até" className="w-40" value={to} onChange={(e) => setTo(e.target.value)} />
        <NativeSelect
          aria-label="Agrupar"
          className="w-56"
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as RevenueGroupBy)}
        >
          {REVENUE_GROUP_BY.map((item) => (
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
            Total: {formatCents(report.data.totalCents)} · {report.data.count} lançamento(s)
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chave</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.data.items.map((item) => (
                <TableRow key={`${item.key}-${item.professionalId ?? ''}`}>
                  <TableCell>{item.professionalName ?? item.key}</TableCell>
                  <TableCell>{item.count}</TableCell>
                  <TableCell>{formatCents(item.amountCents)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      ) : null}
    </div>
  );
}
