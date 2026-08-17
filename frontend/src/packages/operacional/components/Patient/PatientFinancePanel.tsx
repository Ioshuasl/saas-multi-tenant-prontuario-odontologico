'use client';

import Link from 'next/link';
import { formatCents } from '@/packages/operacional/helpers/FormatCents';
import { operacionalErrorMessage } from '@/packages/operacional/helpers/OperacionalErrorMessage';
import { usePatientFinanceHook } from '@/packages/operacional/hooks/Patient/usePatientFinanceHook';
import type { PatientFinancePanelProps } from '@/packages/operacional/types/Patient/PatientFinancePanelTypes';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';

const OPEN_STATUSES = new Set(['OPEN', 'PARTIALLY_PAID', 'OVERDUE']);

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

  const openCents = (installments.data?.items ?? [])
    .filter((item) => OPEN_STATUSES.has(item.status))
    .reduce((sum, item) => sum + Math.max(0, item.amountCents - item.paidCents), 0);

  return (
    <div className="grid max-w-md gap-4">
      <h2 className="text-sm font-medium">Financeiro</h2>
      <dl className="grid gap-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Saldo em aberto</dt>
          <dd className="font-medium">{formatCents(openCents)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Crédito disponível</dt>
          <dd className="font-medium">{formatCents(credit.data?.balanceCents ?? 0)}</dd>
        </div>
      </dl>
      <Button type="button" variant="outline" className="w-fit" render={<Link href={`/app/financeiro/receber?patientId=${encodeURIComponent(patientId)}`} prefetch={false} />}>
        Ver contas a receber
      </Button>
    </div>
  );
}
