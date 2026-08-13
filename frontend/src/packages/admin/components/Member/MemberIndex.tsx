'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { MemberTable } from '@/packages/admin/components/Member/MemberTable';
import { adminErrorMessage } from '@/packages/admin/helpers/AdminErrorMessage';
import { useInvitationDeleteHook } from '@/packages/admin/hooks/Invitation/useInvitationDeleteHook';
import { useInvitationListHook } from '@/packages/admin/hooks/Invitation/useInvitationListHook';
import { useInvitationResendHook } from '@/packages/admin/hooks/Invitation/useInvitationResendHook';
import { useMemberListHook } from '@/packages/admin/hooks/Member/useMemberListHook';
import type { MemberSummary } from '@/packages/admin/types/Member/MemberTypes';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';

const InvitationFormDialog = dynamic(
  () =>
    import('@/packages/admin/components/Member/InvitationFormDialog').then(
      (m) => m.InvitationFormDialog,
    ),
  { ssr: false },
);
const MemberFormDialog = dynamic(
  () =>
    import('@/packages/admin/components/Member/MemberFormDialog').then((m) => m.MemberFormDialog),
  { ssr: false },
);

export function MemberIndex() {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [editing, setEditing] = useState<MemberSummary | null>(null);
  const membersQuery = useMemberListHook();
  const invitationsQuery = useInvitationListHook();
  const resend = useInvitationResendHook();
  const revoke = useInvitationDeleteHook();

  if (membersQuery.isLoading || invitationsQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando…</p>;
  }

  if (membersQuery.isError || invitationsQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {adminErrorMessage(membersQuery.error ?? invitationsQuery.error)}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Membros</h1>
        <Button type="button" onClick={() => setIsInviteOpen(true)}>
          Convidar
        </Button>
      </div>

      {(resend.isError || revoke.isError) && (
        <Alert variant="destructive">
          <AlertDescription>
            {adminErrorMessage(resend.error ?? revoke.error)}
          </AlertDescription>
        </Alert>
      )}

      <MemberTable
        members={membersQuery.data ?? []}
        invitations={invitationsQuery.data ?? []}
        onEditMember={setEditing}
        onResendInvitation={(id) => resend.mutate(id)}
        onRevokeInvitation={(id) => revoke.mutate(id)}
        resendingId={resend.isPending ? resend.variables : null}
        revokingId={revoke.isPending ? revoke.variables : null}
      />

      {isInviteOpen ? (
        <InvitationFormDialog onClose={() => setIsInviteOpen(false)} />
      ) : null}
      {editing ? (
        <MemberFormDialog member={editing} onClose={() => setEditing(null)} />
      ) : null}
    </div>
  );
}
