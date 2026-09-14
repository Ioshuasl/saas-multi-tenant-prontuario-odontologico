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
import { ClivraPageHeader, ClivraSurface } from '@/shared/layout/ClivraPage';
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
    <Suspense
      fallback={
        <div className="grid min-w-0 gap-4">
          <ClivraPageHeader
            title="Auditoria"
            description="Quem acessou ou alterou dados da clínica. A trilha é somente leitura."
          />
          <ClivraSurface contentClassName="px-4 py-6">
            <p className="text-sm text-muted-foreground">Carregando auditoria…</p>
          </ClivraSurface>
        </div>
      }
    >
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
    return (
      <div className="grid min-w-0 gap-4">
        <ClivraPageHeader
          title="Auditoria"
          description="Quem acessou ou alterou dados da clínica. A trilha é somente leitura."
        />
        <ClivraSurface contentClassName="px-4 py-6">
          <p className="text-sm text-muted-foreground">Carregando auditoria…</p>
        </ClivraSurface>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="grid min-w-0 gap-4">
        <ClivraPageHeader
          title="Auditoria"
          description="Quem acessou ou alterou dados da clínica. A trilha é somente leitura."
        />
        <Alert variant="destructive">
          <AlertDescription>
            Você não tem permissão para consultar a trilha de auditoria.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="grid min-w-0 gap-4">
      <ClivraPageHeader
        title="Auditoria"
        description="Quem acessou ou alterou dados da clínica. A trilha é somente leitura."
      />

      <ClivraSurface
        toolbar={
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
        }
        contentClassName="px-4 py-2"
      >
        {listQuery.isLoading ? (
          <p className="py-4 text-sm text-muted-foreground">Carregando eventos…</p>
        ) : listQuery.isError ? (
          <div className="py-4">
            <p className="text-sm text-destructive" role="alert">
              {adminErrorMessage(listQuery.error)}
            </p>
            <Button
              type="button"
              variant="link"
              className="mt-2 h-auto cursor-pointer px-0"
              onClick={() => void listQuery.refetch()}
            >
              Tentar novamente
            </Button>
          </div>
        ) : (
          <>
            <AuditLogTable logs={logs} actorNames={actorNames} patientNames={patientNames} />
            {listQuery.hasNextPage ? (
              <div className="border-t border-border px-0 py-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-fit cursor-pointer"
                  disabled={listQuery.isFetchingNextPage}
                  onClick={() => {
                    void listQuery.fetchNextPage();
                  }}
                >
                  {listQuery.isFetchingNextPage ? 'Carregando…' : 'Carregar mais'}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </ClivraSurface>
    </div>
  );
}
