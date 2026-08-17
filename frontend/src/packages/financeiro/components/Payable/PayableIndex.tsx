'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { PayableTable } from '@/packages/financeiro/components/Payable/PayableTable';
import { financeiroErrorMessage } from '@/packages/financeiro/helpers/FinanceiroErrorMessage';
import { useClinicDefaultUnitGetHook } from '@/packages/financeiro/hooks/Clinic/useClinicDefaultUnitGetHook';
import { useFinancialCategoryListHook } from '@/packages/financeiro/hooks/FinancialCategory/useFinancialCategoryListHook';
import { usePayableListHook } from '@/packages/financeiro/hooks/Payable/usePayableListHook';
import type { Payable } from '@/packages/financeiro/types/Payable/PayableTypes';
import type { PayableStatus } from '@/packages/financeiro/enum/Payable/PayableStatusEnum';
import { PAYABLE_STATUSES, PAYABLE_STATUS_LABELS } from '@/packages/financeiro/enum/Payable/PayableStatusEnum';
import { Can } from '@/shared/auth/Can';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { NativeSelect, NativeSelectOption } from '@/shared/ui/native-select';

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

export function PayableIndex() {
  const [status, setStatus] = useState<PayableStatus | ''>('OPEN');
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Payable | undefined>();
  const [payTarget, setPayTarget] = useState<Payable | null>(null);
  const unitQuery = useClinicDefaultUnitGetHook();
  const categories = useFinancialCategoryListHook('EXPENSE');
  const listQuery = usePayableListHook({
    status: status || undefined,
  });

  const categoryNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const item of categories.data ?? []) map[item.id] = item.name;
    return map;
  }, [categories.data]);

  if (listQuery.isLoading || unitQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando contas a pagar…</p>;
  }

  if (listQuery.isError || unitQuery.isError || !unitQuery.data) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {financeiroErrorMessage(listQuery.error ?? unitQuery.error)}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Contas a pagar</h1>
        <Can permission="finance.write">
          <Button
            type="button"
            onClick={() => {
              setEditTarget(undefined);
              setFormOpen(true);
            }}
          >
            Nova conta
          </Button>
        </Can>
      </div>

      <NativeSelect
        aria-label="Filtrar status"
        className="w-56"
        value={status}
        onChange={(event) => setStatus(event.target.value as PayableStatus | '')}
      >
        <NativeSelectOption value="">Todos</NativeSelectOption>
        {PAYABLE_STATUSES.map((item) => (
          <NativeSelectOption key={item} value={item}>
            {PAYABLE_STATUS_LABELS[item]}
          </NativeSelectOption>
        ))}
      </NativeSelect>

      <PayableTable
        payables={listQuery.data?.items ?? []}
        categoryNames={categoryNames}
        onEdit={(payable) => {
          setEditTarget(payable);
          setFormOpen(true);
        }}
        onPay={(payable) => setPayTarget(payable)}
      />

      {formOpen && unitQuery.data ? (
        <PayableFormDialog
          unitId={unitQuery.data.id}
          payable={editTarget}
          onClose={() => {
            setFormOpen(false);
            setEditTarget(undefined);
          }}
        />
      ) : null}
      {payTarget ? (
        <PayablePayFormDialog payable={payTarget} onClose={() => setPayTarget(null)} />
      ) : null}
    </div>
  );
}
