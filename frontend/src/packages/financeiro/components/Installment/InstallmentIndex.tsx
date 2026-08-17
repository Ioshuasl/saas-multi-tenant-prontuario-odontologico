'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { InstallmentFilter } from '@/packages/financeiro/components/Installment/InstallmentFilter';
import { InstallmentTable } from '@/packages/financeiro/components/Installment/InstallmentTable';
import { INSTALLMENT_PAYABLE_STATUSES } from '@/packages/financeiro/enum/Installment/InstallmentStatusEnum';
import { financeiroErrorMessage } from '@/packages/financeiro/helpers/FinanceiroErrorMessage';
import { useInstallmentListHook } from '@/packages/financeiro/hooks/Installment/useInstallmentListHook';
import { usePatientListHook } from '@/packages/financeiro/hooks/Patient/usePatientListHook';
import type {
  Installment,
  InstallmentListPreset,
  InstallmentListQuery,
} from '@/packages/financeiro/types/Installment/InstallmentTypes';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { NativeSelect, NativeSelectOption } from '@/shared/ui/native-select';

const PaymentFormDialog = dynamic(
  () =>
    import('@/packages/financeiro/components/Payment/PaymentFormDialog').then(
      (m) => m.PaymentFormDialog,
    ),
  { ssr: false },
);

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildListQuery(
  preset: InstallmentListPreset,
  patientId?: string,
): InstallmentListQuery {
  const today = todayIsoDate();
  if (preset === 'due_today') {
    return { patientId, dueFrom: today, dueTo: today, limit: 50 };
  }
  if (preset === 'overdue') {
    return { patientId, status: 'OVERDUE', limit: 50 };
  }
  return { patientId, limit: 50 };
}

export function InstallmentIndex() {
  const searchParams = useSearchParams();
  const initialPatientId = searchParams.get('patientId') ?? '';
  const [patientSearch, setPatientSearch] = useState('');
  const deferredSearch = useDeferredValue(patientSearch);
  const [preset, setPreset] = useState<InstallmentListPreset>('');
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId);
  const [payTarget, setPayTarget] = useState<Installment | null>(null);

  const patientsQuery = usePatientListHook(deferredSearch);
  const namesQuery = usePatientListHook('');
  const listQuery = useInstallmentListHook(buildListQuery(preset, selectedPatientId || undefined));

  const patientNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const patient of [
      ...(namesQuery.data?.items ?? []),
      ...(patientsQuery.data?.items ?? []),
    ]) {
      map[patient.id] = patient.socialName || patient.name;
    }
    return map;
  }, [namesQuery.data, patientsQuery.data]);

  const rows = useMemo(() => {
    const items = listQuery.data?.items ?? [];
    if (preset === '') {
      return items.filter((item) => INSTALLMENT_PAYABLE_STATUSES.includes(item.status));
    }
    return items;
  }, [listQuery.data, preset]);

  if (listQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando contas a receber…</p>;
  }

  if (listQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{financeiroErrorMessage(listQuery.error)}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Contas a receber</h1>
      </div>

      <InstallmentFilter
        patientSearch={patientSearch}
        onPatientSearchChange={setPatientSearch}
        preset={preset}
        onPresetChange={setPreset}
      />

      {deferredSearch && (patientsQuery.data?.items.length ?? 0) > 0 ? (
        <NativeSelect
          aria-label="Paciente do filtro"
          className="max-w-md"
          value={selectedPatientId}
          onChange={(event) => setSelectedPatientId(event.target.value)}
        >
          <NativeSelectOption value="">Todos os pacientes</NativeSelectOption>
          {patientsQuery.data!.items.map((item) => (
            <NativeSelectOption key={item.id} value={item.id}>
              {item.socialName || item.name} (#{item.code})
            </NativeSelectOption>
          ))}
        </NativeSelect>
      ) : null}

      <InstallmentTable
        installments={rows}
        patientNames={patientNames}
        onPay={(installment) => setPayTarget(installment)}
      />

      {payTarget ? (
        <PaymentFormDialog
          installment={payTarget}
          patientName={patientNames[payTarget.patientId] ?? 'Paciente'}
          onClose={() => setPayTarget(null)}
        />
      ) : null}
    </div>
  );
}
