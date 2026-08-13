'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { AnamnesisFormTable } from '@/packages/admin/components/AnamnesisForm/AnamnesisFormTable';
import { QUESTION_TYPE_LABELS } from '@/packages/admin/enum/AnamnesisForm/QuestionTypeEnum';
import { adminErrorMessage } from '@/packages/admin/helpers/AdminErrorMessage';
import { useAnamnesisFormListHook } from '@/packages/admin/hooks/AnamnesisForm/useAnamnesisFormListHook';
import type { AnamnesisFormSummary } from '@/packages/admin/types/AnamnesisForm/AnamnesisFormTypes';
import { Can } from '@/shared/auth/Can';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';

const AnamnesisFormFormDialog = dynamic(
  () =>
    import('@/packages/admin/components/AnamnesisForm/AnamnesisFormFormDialog').then(
      (m) => m.AnamnesisFormFormDialog,
    ),
  { ssr: false },
);

export function AnamnesisFormIndex() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const formsQuery = useAnamnesisFormListHook();

  const selected = useMemo(
    () => formsQuery.data?.find((form) => form.id === selectedId) ?? null,
    [formsQuery.data, selectedId],
  );
  const active = useMemo(
    () => formsQuery.data?.find((form) => form.active) ?? formsQuery.data?.[0],
    [formsQuery.data],
  );

  if (formsQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando…</p>;
  }

  if (formsQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{adminErrorMessage(formsQuery.error)}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Anamnese</h1>
        <Can permission="settings.write">
          <Button type="button" onClick={() => setIsCreateOpen(true)}>
            Nova versão
          </Button>
        </Can>
      </div>

      <p className="text-sm text-muted-foreground">
        Versões anteriores ficam somente leitura. Publicar cria uma nova versão ativa.
      </p>

      <AnamnesisFormTable
        forms={formsQuery.data ?? []}
        selectedId={selectedId}
        onSelect={(form: AnamnesisFormSummary) => setSelectedId(form.id)}
      />

      {selected ? (
        <div className="grid gap-2 rounded-md border p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-medium">
              {selected.name} · v{selected.version}
            </h2>
            <Badge variant={selected.active ? 'secondary' : 'outline'}>
              {selected.active ? 'Ativa' : 'Anterior'}
            </Badge>
          </div>
          <ul className="grid gap-2 text-sm">
            {selected.questions.map((question) => (
              <li key={question.id} className="rounded-md bg-muted/40 px-3 py-2">
                <p className="font-medium">{question.label}</p>
                <p className="text-muted-foreground">
                  {question.id} · {QUESTION_TYPE_LABELS[question.type]}
                  {question.required ? ' · obrigatória' : ''}
                  {question.showWhen?.patientGender
                    ? ` · sexo ${question.showWhen.patientGender}`
                    : ''}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {isCreateOpen ? (
        <AnamnesisFormFormDialog source={active} onClose={() => setIsCreateOpen(false)} />
      ) : null}
    </div>
  );
}
