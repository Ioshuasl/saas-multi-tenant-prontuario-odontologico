'use client';

import Link from 'next/link';
import {
  DATA_SUBJECT_REQUEST_STATUS_LABELS,
  DATA_SUBJECT_REQUEST_TERMINAL_STATUSES,
} from '@/packages/admin/enum/DataSubjectRequest/DataSubjectRequestStatusEnum';
import { DATA_SUBJECT_REQUEST_TYPE_LABELS } from '@/packages/admin/enum/DataSubjectRequest/DataSubjectRequestTypeEnum';
import type { DataSubjectRequestTableProps } from '@/packages/admin/types/DataSubjectRequest/DataSubjectRequestTableTypes';
import { Button } from '@/shared/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR');
}

export function DataSubjectRequestTable({
  requests,
  patientNames,
  onComplete,
  onReject,
}: DataSubjectRequestTableProps) {
  if (requests.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Nenhuma solicitação do titular registrada.</p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Paciente</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Prazo</TableHead>
          <TableHead>Pacote</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request) => {
          const terminal = DATA_SUBJECT_REQUEST_TERMINAL_STATUSES.includes(request.status);
          const patientName = patientNames[request.patientId];
          return (
            <TableRow key={request.id}>
              <TableCell>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto px-0"
                  nativeButton={false}
                  render={
                    <Link href={`/app/pacientes/${request.patientId}`} prefetch={false} />
                  }
                >
                  {patientName ?? 'Ver ficha'}
                </Button>
              </TableCell>
              <TableCell>{DATA_SUBJECT_REQUEST_TYPE_LABELS[request.type]}</TableCell>
              <TableCell>{DATA_SUBJECT_REQUEST_STATUS_LABELS[request.status]}</TableCell>
              <TableCell>{formatWhen(request.dueAt)}</TableCell>
              <TableCell>
                {request.exportUrl ? (
                  <Button
                    variant="outline"
                    size="sm"
                    nativeButton={false}
                    render={<a href={request.exportUrl} target="_blank" rel="noreferrer" />}
                  >
                    Baixar pacote
                  </Button>
                ) : request.type === 'ACCESS' || request.type === 'PORTABILITY' ? (
                  <span className="text-sm text-muted-foreground">Preparando pacote…</span>
                ) : (
                  '—'
                )}
              </TableCell>
              <TableCell>
                {terminal ? null : (
                  <div className="flex flex-wrap gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onComplete(request)}
                    >
                      Concluir
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onReject(request)}
                    >
                      Rejeitar
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
