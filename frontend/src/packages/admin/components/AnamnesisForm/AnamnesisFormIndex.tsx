'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { PlusIcon } from 'lucide-react';
import { AnamnesisFormTable } from '@/packages/admin/components/AnamnesisForm/AnamnesisFormTable';
import { QUESTION_TYPE_LABELS } from '@/packages/admin/enum/AnamnesisForm/QuestionTypeEnum';
import { adminErrorMessage } from '@/packages/admin/helpers/AdminErrorMessage';
import { useAnamnesisFormListHook } from '@/packages/admin/hooks/AnamnesisForm/useAnamnesisFormListHook';
import type { AnamnesisFormSummary } from '@/packages/admin/types/AnamnesisForm/AnamnesisFormTypes';
import { Can } from '@/shared/auth/Can';
import { ClivraPageHeader, ClivraSurface } from '@/shared/layout/ClivraPage';
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

  return (
    <div className="grid min-w-0 gap-4">
      <ClivraPageHeader
        title="Anamnese"
        description="Versões do formulário. Versões anteriores ficam somente leitura."
        action={
          <Can permission="settings.write">
            <Button type="button" onClick={() => setIsCreateOpen(true)} className="cursor-pointer">
              <PlusIcon className="size-4" strokeWidth={1.7} />
              Nova versão
            </Button>
          </Can>
        }
      />

      {formsQuery.isLoading ? (
        <ClivraSurface contentClassName="px-4 py-6">
          <p className="text-sm text-muted-foreground">Carregando…</p>
        </ClivraSurface>
      ) : formsQuery.isError ? (
        <ClivraSurface contentClassName="px-4 py-6">
          <Alert variant="destructive">
            <AlertDescription>{adminErrorMessage(formsQuery.error)}</AlertDescription>
          </Alert>
        </ClivraSurface>
      ) : (
        <>
          <ClivraSurface contentClassName="px-4 py-2">
            <AnamnesisFormTable
              forms={formsQuery.data ?? []}
              selectedId={selectedId}
              onSelect={(form: AnamnesisFormSummary) => setSelectedId(form.id)}
            />
          </ClivraSurface>

          {selected ? (
            <ClivraSurface
              toolbar={
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-semibold text-foreground">
                    {selected.name} · v{selected.version}
                  </h2>
                  <Badge variant={selected.active ? 'secondary' : 'outline'}>
                    {selected.active ? 'Ativa' : 'Anterior'}
                  </Badge>
                </div>
              }
              contentClassName="px-4 py-3"
            >
              <ul className="grid gap-2 text-sm">
                {selected.questions.map((question) => (
                  <li key={question.id} className="rounded-lg bg-muted/40 px-3 py-2">
                    <p className="font-medium text-foreground">{question.label}</p>
                    <p className="text-muted-foreground">
                      {QUESTION_TYPE_LABELS[question.type]}
                      {question.required ? ' · obrigatória' : ''}
                      {question.showWhen?.patientGender
                        ? ` · sexo ${question.showWhen.patientGender}`
                        : ''}
                    </p>
                  </li>
                ))}
              </ul>
            </ClivraSurface>
          ) : null}
        </>
      )}

      {isCreateOpen ? (
        <AnamnesisFormFormDialog source={active} onClose={() => setIsCreateOpen(false)} />
      ) : null}
    </div>
  );
}
