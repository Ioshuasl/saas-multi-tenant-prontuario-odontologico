'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  buildFinanceAttentionItems,
  buildFinanceMovementItems,
  FinancePanelAttention,
  FinancePanelMetrics,
  FinancePanelMovements,
} from '@/packages/financeiro/components/FinancePanel/FinancePanelSections';
import { financeiroErrorMessage } from '@/packages/financeiro/helpers/FinanceiroErrorMessage';
import {
  addDaysIso,
  remainingCents,
  todayIsoDate,
} from '@/packages/financeiro/helpers/FinanceiroDate';
import { useClinicDefaultUnitGetHook } from '@/packages/financeiro/hooks/Clinic/useClinicDefaultUnitGetHook';
import { useInstallmentListHook } from '@/packages/financeiro/hooks/Installment/useInstallmentListHook';
import { usePatientListHook } from '@/packages/financeiro/hooks/Patient/usePatientListHook';
import { usePayableListHook } from '@/packages/financeiro/hooks/Payable/usePayableListHook';
import type { FinanceMovementFilter } from '@/packages/financeiro/types/FinancePanel/FinancePanelTypes';
import type { Installment } from '@/packages/financeiro/types/Installment/InstallmentTypes';
import type { Payable } from '@/packages/financeiro/types/Payable/PayableTypes';
import { Can } from '@/shared/auth/Can';
import { ClivraPageHeader } from '@/shared/layout/ClivraPage';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button, buttonVariants } from '@/shared/ui/button';
import { cn } from '@/shared/helpers/utils';

const MovementFormDrawer = dynamic(
  () =>
    import('@/packages/financeiro/components/FinancePanel/MovementFormDrawer').then(
      (m) => m.MovementFormDrawer,
    ),
  { ssr: false },
);

const PaymentFormDialog = dynamic(
  () =>
    import('@/packages/financeiro/components/Payment/PaymentFormDialog').then(
      (m) => m.PaymentFormDialog,
    ),
  { ssr: false },
);

const PayableFormDialog = dynamic(
  () =>
    import('@/packages/financeiro/components/Payable/PayableFormDialog').then(
      (m) => m.PayableFormDialog,
    ),
  { ssr: false },
);

const PayablePayFormDialog = dynamic(
  () =>
    import('@/packages/financeiro/components/Payable/PayablePayFormDialog').then(
      (m) => m.PayablePayFormDialog,
    ),
  { ssr: false },
);

export function FinancePanelIndex() {
  const today = todayIsoDate();
  const in7 = addDaysIso(today, 7);
  const [filter, setFilter] = useState<FinanceMovementFilter>('todas');
  const [movementOpen, setMovementOpen] = useState(false);
  const [payTarget, setPayTarget] = useState<Installment | null>(null);
  const [payablePayTarget, setPayablePayTarget] = useState<Payable | null>(null);
  const [payableFormOpen, setPayableFormOpen] = useState(false);

  const unitQuery = useClinicDefaultUnitGetHook();
  const namesQuery = usePatientListHook('');
  const dueTodayQuery = useInstallmentListHook({ dueFrom: today, dueTo: today, limit: 50 });
  const overdueQuery = useInstallmentListHook({ status: 'OVERDUE', limit: 50 });
  const openInstallmentsQuery = useInstallmentListHook({ limit: 50 });
  const payablesQuery = usePayableListHook({ status: 'OPEN', limit: 50 });

  const patientNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const patient of namesQuery.data?.items ?? []) {
      map[patient.id] = patient.socialName || patient.name;
    }
    return map;
  }, [namesQuery.data]);

  const dueToday = dueTodayQuery.data?.items ?? [];
  const overdue = overdueQuery.data?.items ?? [];
  const openInstallments = openInstallmentsQuery.data?.items ?? [];
  const payables = payablesQuery.data?.items ?? [];
  const payables7d = payables.filter((item) => item.dueDate >= today && item.dueDate <= in7);

  const attention = useMemo(
    () =>
      buildFinanceAttentionItems({
        dueToday,
        overdue,
        payables,
        patientNames,
        today,
      }),
    [dueToday, overdue, payables, patientNames, today],
  );

  const movements = useMemo(
    () =>
      buildFinanceMovementItems({
        installments: openInstallments,
        payables,
        patientNames,
        filter,
      }),
    [openInstallments, payables, patientNames, filter],
  );

  const loading =
    dueTodayQuery.isLoading ||
    overdueQuery.isLoading ||
    openInstallmentsQuery.isLoading ||
    payablesQuery.isLoading;
  const error =
    dueTodayQuery.error ??
    overdueQuery.error ??
    openInstallmentsQuery.error ??
    payablesQuery.error;

  const onReceber = (installment: Installment) => {
    setMovementOpen(false);
    setPayTarget(installment);
  };

  const onPagar = (payable: Payable) => {
    setMovementOpen(false);
    setPayableFormOpen(false);
    setPayablePayTarget(payable);
  };

  return (
    <div className="grid min-w-0 gap-4">
      <ClivraPageHeader
        title="Hoje na clínica"
        description="O que entra, o que sai e o que precisa da sua atenção agora."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/app/financeiro/relatorios"
              className={cn(buttonVariants({ variant: 'outline' }), 'cursor-pointer')}
            >
              Relatórios
            </Link>
            <Can permission="finance.write">
              <Button type="button" className="cursor-pointer" onClick={() => setMovementOpen(true)}>
                Registrar movimentação
              </Button>
            </Can>
          </div>
        }
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando painel financeiro…</p>
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription>{financeiroErrorMessage(error)}</AlertDescription>
        </Alert>
      ) : (
        <>
          <FinancePanelMetrics
            dueTodayCents={dueToday.reduce(
              (sum, item) => sum + remainingCents(item.amountCents, item.paidCents),
              0,
            )}
            dueTodayCount={dueToday.length}
            overdueCents={overdue.reduce(
              (sum, item) => sum + remainingCents(item.amountCents, item.paidCents),
              0,
            )}
            overdueCount={overdue.length}
            payables7dCents={payables7d.reduce((sum, item) => sum + item.amountCents, 0)}
            payables7dCount={payables7d.length}
          />

          <div className="grid gap-4 xl:grid-cols-2">
            <FinancePanelAttention items={attention} onReceber={onReceber} onPagar={onPagar} />
            <FinancePanelMovements
              items={movements}
              filter={filter}
              onFilterChange={setFilter}
              onReceber={onReceber}
              onPagar={onPagar}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Ajustes de caixa ficam desativados no fluxo diário.
          </p>
        </>
      )}

      {movementOpen ? (
        <MovementFormDrawer
          installments={openInstallments}
          payables={payables}
          patientNames={patientNames}
          onClose={() => setMovementOpen(false)}
          onPickEntrada={onReceber}
          onPickSaida={onPagar}
          onCreateSaida={() => {
            setMovementOpen(false);
            setPayableFormOpen(true);
          }}
        />
      ) : null}

      {payTarget ? (
        <PaymentFormDialog
          installment={payTarget}
          patientName={patientNames[payTarget.patientId] ?? 'Paciente'}
          onClose={() => setPayTarget(null)}
        />
      ) : null}

      {payablePayTarget ? (
        <PayablePayFormDialog payable={payablePayTarget} onClose={() => setPayablePayTarget(null)} />
      ) : null}

      {payableFormOpen && unitQuery.data ? (
        <PayableFormDialog
          unitId={unitQuery.data.id}
          onClose={() => setPayableFormOpen(false)}
        />
      ) : null}
    </div>
  );
}
