'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { PlusIcon } from 'lucide-react';
import { ProfessionalTable } from '@/packages/admin/components/Professional/ProfessionalTable';
import { adminErrorMessage } from '@/packages/admin/helpers/AdminErrorMessage';
import { useMemberListHook } from '@/packages/admin/hooks/Member/useMemberListHook';
import { useProfessionalListHook } from '@/packages/admin/hooks/Professional/useProfessionalListHook';
import type { ProfessionalSummary } from '@/packages/admin/types/Professional/ProfessionalTypes';
import { ClivraPageHeader, ClivraSurface } from '@/shared/layout/ClivraPage';
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

  const loading = professionalsQuery.isLoading || membersQuery.isLoading;
  const professionals = professionalsQuery.data ?? [];
  const members = membersQuery.data ?? [];

  return (
    <div className="grid min-w-0 gap-4">
      <ClivraPageHeader
        title="Profissionais"
        description="Dentistas e profissionais vinculados à agenda e aos atendimentos."
        action={
          <Button type="button" onClick={() => setIsCreateOpen(true)} className="cursor-pointer">
            <PlusIcon className="size-4" strokeWidth={1.7} />
            Novo profissional
          </Button>
        }
      />

      {loading ? (
        <ClivraSurface contentClassName="px-4 py-6">
          <p className="text-sm text-muted-foreground">Carregando…</p>
        </ClivraSurface>
      ) : professionalsQuery.isError ? (
        <ClivraSurface contentClassName="px-4 py-6">
          <Alert variant="destructive">
            <AlertDescription>{adminErrorMessage(professionalsQuery.error)}</AlertDescription>
          </Alert>
        </ClivraSurface>
      ) : (
        <ClivraSurface contentClassName="px-4 py-2">
          <ProfessionalTable professionals={professionals} onEdit={setEditing} />
        </ClivraSurface>
      )}

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
