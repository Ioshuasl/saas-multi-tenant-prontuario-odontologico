'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PlusIcon } from 'lucide-react';
import { ChairTable } from '@/packages/admin/components/Chair/ChairTable';
import { adminErrorMessage } from '@/packages/admin/helpers/AdminErrorMessage';
import { SETTINGS_SECTION, settingsHref } from '@/packages/admin/helpers/SettingsTabs';
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
  const router = useRouter();
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<ChairSummary | undefined>();
  const clinicQuery = useClinicGetHook();
  const chairsEnabled = clinicQuery.data?.chairsEnabled === true;
  const unitId = clinicQuery.data?.defaultUnit?.id;
  const chairsQuery = useChairListHook(unitId, { enabled: chairsEnabled && Boolean(unitId) });

  useEffect(() => {
    if (clinicQuery.isSuccess && !chairsEnabled) {
      router.replace(settingsHref(SETTINGS_SECTION.CLINICA));
    }
  }, [clinicQuery.isSuccess, chairsEnabled, router]);

  const openCreate = () => {
    setEditing(undefined);
    setFormMode('create');
  };

  if (clinicQuery.isLoading) {
    return (
      <div className="grid min-w-0 gap-4">
        <ClivraPageHeader
          title="Cadeiras"
          description="Salas e cadeiras usadas na agenda da unidade padrão."
        />
        <ClivraSurface contentClassName="px-4 py-6">
          <p className="text-sm text-muted-foreground">Carregando…</p>
        </ClivraSurface>
      </div>
    );
  }

  if (!chairsEnabled) {
    return (
      <div className="grid min-w-0 gap-4">
        <ClivraPageHeader
          title="Cadeiras"
          description="Salas e cadeiras usadas na agenda da unidade padrão."
        />
        <Alert>
          <AlertDescription>
            Agenda por cadeira está desativada.{' '}
            <Link
              href={settingsHref(SETTINGS_SECTION.CLINICA)}
              className="font-medium underline underline-offset-2"
            >
              Ative em Configurações → Clínica
            </Link>
            .
          </AlertDescription>
        </Alert>
      </div>
    );
  }

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

      {chairsQuery.isLoading ? (
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
