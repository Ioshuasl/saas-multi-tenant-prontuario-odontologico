'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { ChairTable } from '@/packages/admin/components/Chair/ChairTable';
import { adminErrorMessage } from '@/packages/admin/helpers/AdminErrorMessage';
import { useChairListHook } from '@/packages/admin/hooks/Chair/useChairListHook';
import { useClinicGetHook } from '@/packages/admin/hooks/Clinic/useClinicGetHook';
import type { ChairSummary } from '@/packages/admin/types/Chair/ChairTypes';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';

const ChairFormDialog = dynamic(
  () =>
    import('@/packages/admin/components/Chair/ChairFormDialog').then((m) => m.ChairFormDialog),
  { ssr: false },
);

export function ChairIndex() {
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<ChairSummary | undefined>();
  const clinicQuery = useClinicGetHook();
  const unitId = clinicQuery.data?.defaultUnit?.id;
  const chairsQuery = useChairListHook(unitId);

  if (clinicQuery.isLoading || chairsQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando…</p>;
  }

  if (!unitId) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Configure a unidade padrão da clínica primeiro.</AlertDescription>
      </Alert>
    );
  }

  if (chairsQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{adminErrorMessage(chairsQuery.error)}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Cadeiras</h1>
        <Button
          type="button"
          onClick={() => {
            setEditing(undefined);
            setFormMode('create');
          }}
        >
          Nova cadeira
        </Button>
      </div>
      <ChairTable
        chairs={chairsQuery.data ?? []}
        onEdit={(chair) => {
          setEditing(chair);
          setFormMode('edit');
        }}
      />
      {formMode ? (
        <ChairFormDialog
          mode={formMode}
          unitId={unitId}
          chair={editing}
          onClose={() => {
            setFormMode(null);
            setEditing(undefined);
          }}
        />
      ) : null}
    </div>
  );
}
