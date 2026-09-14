'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { PlusIcon } from 'lucide-react';
import { ChairTable } from '@/packages/admin/components/Chair/ChairTable';
import { adminErrorMessage } from '@/packages/admin/helpers/AdminErrorMessage';
import { useChairListHook } from '@/packages/admin/hooks/Chair/useChairListHook';
import { useClinicGetHook } from '@/packages/admin/hooks/Clinic/useClinicGetHook';
import type { ChairSummary } from '@/packages/admin/types/Chair/ChairTypes';
import { ClivraPageHeader, ClivraSurface } from '@/shared/layout/ClivraPage';
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

  const openCreate = () => {
    setEditing(undefined);
    setFormMode('create');
  };

  return (
    <div className="grid min-w-0 gap-4">
      <ClivraPageHeader
        title="Cadeiras"
        description="Salas e cadeiras usadas na agenda da unidade padrão."
        action={
          unitId ? (
            <Button type="button" onClick={openCreate} className="cursor-pointer">
              <PlusIcon className="size-4" strokeWidth={1.7} />
              Nova cadeira
            </Button>
          ) : null
        }
      />

      {clinicQuery.isLoading || chairsQuery.isLoading ? (
        <ClivraSurface contentClassName="px-4 py-6">
          <p className="text-sm text-muted-foreground">Carregando…</p>
        </ClivraSurface>
      ) : !unitId ? (
        <Alert variant="destructive">
          <AlertDescription>Configure a unidade padrão da clínica primeiro.</AlertDescription>
        </Alert>
      ) : chairsQuery.isError ? (
        <ClivraSurface contentClassName="px-4 py-6">
          <p className="text-sm text-destructive" role="alert">
            {adminErrorMessage(chairsQuery.error)}
          </p>
          <Button
            type="button"
            variant="link"
            className="mt-2 h-auto cursor-pointer px-0"
            onClick={() => void chairsQuery.refetch()}
          >
            Tentar novamente
          </Button>
        </ClivraSurface>
      ) : (
        <ClivraSurface contentClassName="px-4 py-2">
          <ChairTable
            chairs={chairsQuery.data ?? []}
            onEdit={(chair) => {
              setEditing(chair);
              setFormMode('edit');
            }}
          />
        </ClivraSurface>
      )}

      {formMode && unitId ? (
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
