'use client';

import { Suspense, useDeferredValue, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AuditLogFilter } from '@/packages/admin/components/AuditLog/AuditLogFilter';
import { AuditLogTable } from '@/packages/admin/components/AuditLog/AuditLogTable';
import { adminErrorMessage } from '@/packages/admin/helpers/AdminErrorMessage';
import { useAuditLogListHook } from '@/packages/admin/hooks/AuditLog/useAuditLogListHook';
import { useAuditLogPatientListHook } from '@/packages/admin/hooks/AuditLog/useAuditLogPatientListHook';
import { useMemberListHook } from '@/packages/admin/hooks/Member/useMemberListHook';
import { useAuth } from '@/shared/auth/AuthProvider';
import { hasPermission } from '@/shared/auth/permissions';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';

function toIsoStart(date: string): string | undefined {
  if (!date) return undefined;
  return new Date(`${date}T00:00:00`).toISOString();
}

function toIsoEnd(date: string): string | undefined {
  if (!date) return undefined;
  return new Date(`${date}T23:59:59.999`).toISOString();
}

export function AuditLogIndex() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando auditoria…</p>}>
      <AuditLogIndexBody />
    </Suspense>
  );
}

function AuditLogIndexBody() {
  const { me } = useAuth();
  const allowed = hasPermission(me, 'audit.read');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [patientSearch, setPatientSearch] = useState('');
  const deferredSearch = useDeferredValue(patientSearch);
  const [patientId, setPatientId] = useState(searchParams.get('patientId') ?? '');
  const [actorId, setActorId] = useState(searchParams.get('actorId') ?? '');
  const [action, setAction] = useState(searchParams.get('action') ?? '');
  const [from, setFrom] = useState(searchParams.get('from') ?? '');
  const [to, setTo] = useState(searchParams.get('to') ?? '');

  const replaceQuery = (patch: Record<string, string>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  const onPatientIdChange = (value: string) => {
    setPatientId(value);
    replaceQuery({ patientId: value });
  };

  const patientsQuery = useAuditLogPatientListHook(deferredSearch, allowed);
  const namesQuery = useAuditLogPatientListHook('', allowed);
  const membersQuery = useMemberListHook(allowed);
  const listQuery = useAuditLogListHook(
    {
      patientId: patientId || undefined,
      actorId: actorId || undefined,
      action: action || undefined,
      from: toIsoStart(from),
      to: toIsoEnd(to),
    },
    allowed,
  );

  const members = membersQuery.data ?? [];
  const patients = useMemo(() => {
    const byId = new Map(
      [...(namesQuery.data?.items ?? []), ...(patientsQuery.data?.items ?? [])].map((item) => [
        item.id,
        item,
      ]),
    );
    return [...byId.values()];
  }, [namesQuery.data, patientsQuery.data]);

  const actorNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const member of members) {
      map[member.id] = member.name;
    }
    return map;
  }, [members]);

  const patientNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const patient of patients) {
      map[patient.id] = patient.socialName || patient.name;
    }
    return map;
  }, [patients]);

  const logs = listQuery.data?.pages.flatMap((page) => page.items) ?? [];

  if (!me) {
    return <p className="text-sm text-muted-foreground">Carregando auditoria…</p>;
  }

  if (!allowed) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Você não tem permissão para consultar a trilha de auditoria.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-xl font-semibold">Auditoria</h1>
        <p className="text-sm text-muted-foreground">
          Quem acessou ou alterou dados da clínica. A trilha é somente leitura.
        </p>
      </div>

      <AuditLogFilter
        patientSearch={patientSearch}
        onPatientSearchChange={setPatientSearch}
        patients={patients}
        patientId={patientId}
        onPatientIdChange={onPatientIdChange}
        members={members}
        actorId={actorId}
        onActorIdChange={setActorId}
        action={action}
        onActionChange={setAction}
        from={from}
        onFromChange={setFrom}
        to={to}
        onToChange={setTo}
      />

      {listQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando eventos…</p>
      ) : listQuery.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{adminErrorMessage(listQuery.error)}</AlertDescription>
        </Alert>
      ) : (
        <>
          <AuditLogTable logs={logs} actorNames={actorNames} patientNames={patientNames} />
          {listQuery.hasNextPage ? (
            <Button
              type="button"
              variant="outline"
              className="w-fit"
              disabled={listQuery.isFetchingNextPage}
              onClick={() => {
                void listQuery.fetchNextPage();
              }}
            >
              {listQuery.isFetchingNextPage ? 'Carregando…' : 'Carregar mais'}
            </Button>
          ) : null}
        </>
      )}
    </div>
  );
}
