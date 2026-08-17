'use client';

import Link from 'next/link';
import { auditActionLabel } from '@/packages/admin/enum/AuditLog/AuditActionEnum';
import { auditActorTypeLabel } from '@/packages/admin/enum/AuditLog/AuditActorTypeEnum';
import type { AuditLogTableProps } from '@/packages/admin/types/AuditLog/AuditLogTableTypes';
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

export function AuditLogTable({ logs, actorNames, patientNames }: AuditLogTableProps) {
  if (logs.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum evento encontrado neste período.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Quando</TableHead>
          <TableHead>Ator</TableHead>
          <TableHead>Ação</TableHead>
          <TableHead>Recurso</TableHead>
          <TableHead>Paciente</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => {
          const actorName = log.actorId ? actorNames[log.actorId] : undefined;
          const patientName = log.patientId ? patientNames[log.patientId] : undefined;
          return (
            <TableRow key={log.id}>
              <TableCell>{formatWhen(log.createdAt)}</TableCell>
              <TableCell>
                {actorName ?? auditActorTypeLabel(log.actorType)}
              </TableCell>
              <TableCell>{auditActionLabel(log.action)}</TableCell>
              <TableCell>{log.resourceType}</TableCell>
              <TableCell>
                {log.patientId ? (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto px-0"
                    nativeButton={false}
                    render={
                      <Link href={`/app/pacientes/${log.patientId}`} prefetch={false} />
                    }
                  >
                    {patientName ?? 'Ver ficha'}
                  </Button>
                ) : (
                  '—'
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
