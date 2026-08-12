'use client';

import { useState } from 'react';
import { ProcedureFormDialog } from '@/packages/admin/components/Procedure/ProcedureFormDialog';
import { ProcedureTable } from '@/packages/admin/components/Procedure/ProcedureTable';
import { adminErrorMessage } from '@/packages/admin/helpers/AdminErrorMessage';
import { useProcedureImportCatalogHook } from '@/packages/admin/hooks/Procedure/useProcedureImportCatalogHook';
import { useProcedureListHook } from '@/packages/admin/hooks/Procedure/useProcedureListHook';
import type { ProcedureSummary } from '@/packages/admin/types/Procedure/ProcedureTypes';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { FadeIn } from '@/shared/motion/FadeIn';

export function ProcedureIndex() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<ProcedureSummary | null>(null);
  const proceduresQuery = useProcedureListHook();
  const importCatalog = useProcedureImportCatalogHook();

  if (proceduresQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando…</p>;
  }

  if (proceduresQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{adminErrorMessage(proceduresQuery.error)}</AlertDescription>
      </Alert>
    );
  }

  return (
    <FadeIn className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Procedimentos</h1>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={importCatalog.isPending}
            onClick={() => importCatalog.mutate()}
          >
            {importCatalog.isPending ? 'Importando…' : 'Importar catálogo'}
          </Button>
          <Button type="button" onClick={() => setIsCreateOpen(true)}>
            Novo procedimento
          </Button>
        </div>
      </div>

      {importCatalog.isSuccess ? (
        <Alert>
          <AlertDescription>
            Importados: {importCatalog.data.imported}. Ignorados: {importCatalog.data.skipped}.
          </AlertDescription>
        </Alert>
      ) : null}
      {importCatalog.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{adminErrorMessage(importCatalog.error)}</AlertDescription>
        </Alert>
      ) : null}

      <ProcedureTable procedures={proceduresQuery.data ?? []} onEdit={setEditing} />
      {isCreateOpen ? (
        <ProcedureFormDialog mode="create" onClose={() => setIsCreateOpen(false)} />
      ) : null}
      {editing ? (
        <ProcedureFormDialog
          mode="edit"
          procedure={editing}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </FadeIn>
  );
}
