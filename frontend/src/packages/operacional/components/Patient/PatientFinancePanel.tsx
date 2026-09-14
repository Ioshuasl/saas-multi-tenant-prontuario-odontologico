'use client';

import Link from 'next/link';
import {
  INSTALLMENT_STATUS_LABELS,
  type InstallmentStatus,
} from '@/packages/financeiro/enum/Installment/InstallmentStatusEnum';
import { formatCents } from '@/packages/operacional/helpers/FormatCents';
import { operacionalErrorMessage } from '@/packages/operacional/helpers/OperacionalErrorMessage';
import { usePatientFinanceHook } from '@/packages/operacional/hooks/Patient/usePatientFinanceHook';
import type { PatientFinancePanelProps } from '@/packages/operacional/types/Patient/PatientFinancePanelTypes';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
import { cn } from '@/shared/helpers/utils';

const OPEN_STATUSES = new Set(['OPEN', 'PARTIALLY_PAID', 'OVERDUE']);

function installmentStatusLabel(status: string): string {
  return INSTALLMENT_STATUS_LABELS[status as InstallmentStatus] ?? status;
}

function installmentStatusClassName(status: string): string | undefined {
  if (status === 'OVERDUE') {
    return 'border-transparent bg-destructive/15 text-destructive';
  }
  if (status === 'PARTIALLY_PAID') {
    return 'border-transparent bg-warning/15 text-warning';
  }
  return undefined;
}

export function PatientFinancePanel({ patientId }: PatientFinancePanelProps) {
  const { installments, credit } = usePatientFinanceHook(patientId);

  if (installments.isLoading || credit.isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando financeiro…</p>;
  }

  if (installments.isError || credit.isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {operacionalErrorMessage(installments.error ?? credit.error)}
        </AlertDescription>
      </Alert>
    );
  }

  const items = installments.data?.items ?? [];
  const openItems = items.filter((item) => OPEN_STATUSES.has(item.status));
  const openCents = openItems.reduce(
    (sum, item) => sum + Math.max(0, item.amountCents - item.paidCents),
    0,
  );

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <CardTitle>Resumo financeiro</CardTitle>
        <CardDescription>
          Visão rápida na ficha — detalhe fica no painel Financeiro.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-muted/50 px-4 py-3">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground">
              SALDO EM ABERTO
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
              {formatCents(openCents)}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 px-4 py-3">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground">
              CRÉDITO DISPONÍVEL
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
              {formatCents(credit.data?.balanceCents ?? 0)}
            </p>
          </div>
        </div>

        <div className="grid gap-2">
          <h3 className="text-sm font-semibold text-foreground">Parcelas em aberto</h3>
          {openItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma parcela em aberto.</p>
          ) : (
            <ul className="grid gap-2">
              {openItems.slice(0, 5).map((item) => {
                const remaining = Math.max(0, item.amountCents - item.paidCents);
                return (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-3 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-foreground">
                        {item.number != null ? `Parcela ${item.number}` : 'Parcela'}
                      </p>
                      <p className="text-muted-foreground">
                        {item.dueDate
                          ? `Venc. ${new Date(item.dueDate).toLocaleDateString('pt-BR')} · `
                          : null}
                        restante {formatCents(remaining)}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(installmentStatusClassName(item.status))}
                    >
                      {installmentStatusLabel(item.status)}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-fit cursor-pointer"
          nativeButton={false}
          render={<Link href="/app/financeiro" prefetch={false} />}
        >
          Ver financeiro
        </Button>
      </CardContent>
    </Card>
  );
}
