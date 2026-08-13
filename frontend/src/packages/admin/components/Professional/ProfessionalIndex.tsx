'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { ProfessionalTable } from '@/packages/admin/components/Professional/ProfessionalTable';
import { adminErrorMessage } from '@/packages/admin/helpers/AdminErrorMessage';
import { useMemberListHook } from '@/packages/admin/hooks/Member/useMemberListHook';
import { useProfessionalListHook } from '@/packages/admin/hooks/Professional/useProfessionalListHook';
import type { ProfessionalSummary } from '@/packages/admin/types/Professional/ProfessionalTypes';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';

const ProfessionalFormDialog = dynamic(
  () =>
    import('@/packages/admin/components/Professional/ProfessionalFormDialog').then(
      (m) => m.ProfessionalFormDialog,
    ),
  { ssr: false },
);

export function ProfessionalIndex() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<ProfessionalSummary | null>(null);
  const professionalsQuery = useProfessionalListHook();
  const membersQuery = useMemberListHook();

  if (professionalsQuery.isLoading || membersQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando…</p>;
  }

  if (professionalsQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{adminErrorMessage(professionalsQuery.error)}</AlertDescription>
      </Alert>
    );
  }

  const professionals = professionalsQuery.data ?? [];
  const members = membersQuery.data ?? [];

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Profissionais</h1>
        <Button type="button" onClick={() => setIsCreateOpen(true)}>
          Novo profissional
        </Button>
      </div>
      <ProfessionalTable professionals={professionals} onEdit={setEditing} />
      {isCreateOpen ? (
        <ProfessionalFormDialog
          mode="create"
          members={members}
          professionals={professionals}
          onClose={() => setIsCreateOpen(false)}
        />
      ) : null}
      {editing ? (
        <ProfessionalFormDialog
          mode="edit"
          professional={editing}
          members={members}
          professionals={professionals}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </div>
  );
}
