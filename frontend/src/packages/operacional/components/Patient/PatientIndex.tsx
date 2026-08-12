'use client';

import { useDeferredValue, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PatientFilter } from '@/packages/operacional/components/Patient/PatientFilter';
import { PatientFormDialog } from '@/packages/operacional/components/Patient/PatientFormDialog';
import { PatientTable } from '@/packages/operacional/components/Patient/PatientTable';
import { operacionalErrorMessage } from '@/packages/operacional/helpers/OperacionalErrorMessage';
import { usePatientListHook } from '@/packages/operacional/hooks/Patient/usePatientListHook';
import { FadeIn } from '@/shared/motion/FadeIn';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';

export function PatientIndex() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [createOpen, setCreateOpen] = useState(false);
  const listQuery = usePatientListHook(deferredSearch);

  if (listQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando pacientes…</p>;
  }

  if (listQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{operacionalErrorMessage(listQuery.error)}</AlertDescription>
      </Alert>
    );
  }

  return (
    <FadeIn className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Pacientes</h1>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          Novo paciente
        </Button>
      </div>

      <PatientFilter value={search} onChange={setSearch} />

      <PatientTable
        patients={listQuery.data?.items ?? []}
        onOpen={(patient) => {
          router.push(`/app/pacientes/${patient.id}`);
        }}
      />

      {createOpen ? (
        <PatientFormDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={(patientId) => {
            setCreateOpen(false);
            router.push(`/app/pacientes/${patientId}`);
          }}
        />
      ) : null}
    </FadeIn>
  );
}
