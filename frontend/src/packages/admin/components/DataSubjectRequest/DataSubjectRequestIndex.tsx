'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { DataSubjectRequestTable } from '@/packages/admin/components/DataSubjectRequest/DataSubjectRequestTable';
import { DATA_SUBJECT_REQUEST_PACKAGE_TYPES } from '@/packages/admin/enum/DataSubjectRequest/DataSubjectRequestTypeEnum';
import { DATA_SUBJECT_REQUEST_TERMINAL_STATUSES } from '@/packages/admin/enum/DataSubjectRequest/DataSubjectRequestStatusEnum';
import { adminErrorMessage } from '@/packages/admin/helpers/AdminErrorMessage';
import { isDataSubjectRequestDueSoon } from '@/packages/admin/helpers/DataSubjectRequestDue';
import { useAuditLogPatientListHook } from '@/packages/admin/hooks/AuditLog/useAuditLogPatientListHook';
import { useDataSubjectRequestGetManyHook } from '@/packages/admin/hooks/DataSubjectRequest/useDataSubjectRequestGetManyHook';
import { useDataSubjectRequestListHook } from '@/packages/admin/hooks/DataSubjectRequest/useDataSubjectRequestListHook';
import type { DataSubjectRequest } from '@/packages/admin/types/DataSubjectRequest/DataSubjectRequestTypes';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';

const DataSubjectRequestFormDialog = dynamic(
  () =>
    import('@/packages/admin/components/DataSubjectRequest/DataSubjectRequestFormDialog').then(
      (m) => m.DataSubjectRequestFormDialog,
    ),
  { ssr: false },
);

const DataSubjectRequestResolveFormDialog = dynamic(
  () =>
    import(
      '@/packages/admin/components/DataSubjectRequest/DataSubjectRequestResolveFormDialog'
    ).then((m) => m.DataSubjectRequestResolveFormDialog),
  { ssr: false },
);

export function DataSubjectRequestIndex() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [resolve, setResolve] = useState<{
    request: DataSubjectRequest;
    status: 'COMPLETED' | 'REJECTED';
  } | null>(null);

  const listQuery = useDataSubjectRequestListHook();
  const namesQuery = useAuditLogPatientListHook('');
  const items = listQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const packageIds = items
    .filter((item) => DATA_SUBJECT_REQUEST_PACKAGE_TYPES.includes(item.type))
    .map((item) => item.id);
  const packageQueries = useDataSubjectRequestGetManyHook(packageIds);

  const requests = useMemo(() => {
    const byId = new Map(
      packageQueries.flatMap((query) => (query.data ? [[query.data.id, query.data] as const] : [])),
    );
    return items.map((item) => byId.get(item.id) ?? item);
  }, [items, packageQueries]);

  const patientNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const patient of namesQuery.data?.items ?? []) {
      map[patient.id] = patient.socialName || patient.name;
    }
    return map;
  }, [namesQuery.data]);

  const dueSoon = requests.filter(
    (item) =>
      !DATA_SUBJECT_REQUEST_TERMINAL_STATUSES.includes(item.status) &&
      isDataSubjectRequestDueSoon(item.dueAt),
  );

  if (listQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando solicitações…</p>;
  }

  if (listQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{adminErrorMessage(listQuery.error)}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-medium">Solicitações do titular</h2>
        <Button type="button" onClick={() => setIsCreateOpen(true)}>
          Nova solicitação
        </Button>
      </div>

      {dueSoon.length > 0 ? (
        <Alert>
          <AlertTitle>Prazo próximo</AlertTitle>
          <AlertDescription>
            Há solicitações do titular com prazo em menos de 3 dias.
          </AlertDescription>
        </Alert>
      ) : null}

      <DataSubjectRequestTable
        requests={requests}
        patientNames={patientNames}
        onComplete={(request) => setResolve({ request, status: 'COMPLETED' })}
        onReject={(request) => setResolve({ request, status: 'REJECTED' })}
      />

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

      {isCreateOpen ? (
        <DataSubjectRequestFormDialog onClose={() => setIsCreateOpen(false)} />
      ) : null}
      {resolve ? (
        <DataSubjectRequestResolveFormDialog
          request={resolve.request}
          status={resolve.status}
          onClose={() => setResolve(null)}
        />
      ) : null}
    </div>
  );
}
