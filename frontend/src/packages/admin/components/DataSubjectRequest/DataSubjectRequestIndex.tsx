'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { PlusIcon } from 'lucide-react';
import { DataSubjectRequestTable } from '@/packages/admin/components/DataSubjectRequest/DataSubjectRequestTable';
import { DATA_SUBJECT_REQUEST_PACKAGE_TYPES } from '@/packages/admin/enum/DataSubjectRequest/DataSubjectRequestTypeEnum';
import { DATA_SUBJECT_REQUEST_TERMINAL_STATUSES } from '@/packages/admin/enum/DataSubjectRequest/DataSubjectRequestStatusEnum';
import { adminErrorMessage } from '@/packages/admin/helpers/AdminErrorMessage';
import { isDataSubjectRequestDueSoon } from '@/packages/admin/helpers/DataSubjectRequestDue';
import { useAuditLogPatientListHook } from '@/packages/admin/hooks/AuditLog/useAuditLogPatientListHook';
import { useDataSubjectRequestGetManyHook } from '@/packages/admin/hooks/DataSubjectRequest/useDataSubjectRequestGetManyHook';
import { useDataSubjectRequestListHook } from '@/packages/admin/hooks/DataSubjectRequest/useDataSubjectRequestListHook';
import type { DataSubjectRequest } from '@/packages/admin/types/DataSubjectRequest/DataSubjectRequestTypes';
import { ClivraSurface } from '@/shared/layout/ClivraPage';
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

  return (
    <ClivraSurface
      toolbar={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Solicitações do titular</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Pedidos LGPD de acesso, correção ou exclusão.
            </p>
          </div>
          <Button type="button" onClick={() => setIsCreateOpen(true)} className="cursor-pointer">
            <PlusIcon className="size-4" strokeWidth={1.7} />
            Nova solicitação
          </Button>
        </div>
      }
      contentClassName="px-4 py-3"
    >
      {dueSoon.length > 0 ? (
        <Alert className="mb-3">
          <AlertTitle>Prazo próximo</AlertTitle>
          <AlertDescription>
            Há solicitações do titular com prazo em menos de 3 dias.
          </AlertDescription>
        </Alert>
      ) : null}

      {listQuery.isLoading ? (
        <p className="py-2 text-sm text-muted-foreground">Carregando solicitações…</p>
      ) : listQuery.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{adminErrorMessage(listQuery.error)}</AlertDescription>
        </Alert>
      ) : (
        <>
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
              className="mt-3 w-fit cursor-pointer"
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
    </ClivraSurface>
  );
}
