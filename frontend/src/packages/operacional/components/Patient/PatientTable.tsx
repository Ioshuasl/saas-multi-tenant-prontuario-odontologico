'use client';

import type { PatientSummary } from '@/packages/operacional/types/Patient/PatientTypes';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';

type PatientTableProps = {
  patients: PatientSummary[];
  onOpen: (patient: PatientSummary) => void;
};

export function PatientTable({ patients, onOpen }: PatientTableProps) {
  if (patients.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum paciente encontrado.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ficha</TableHead>
          <TableHead>Nome</TableHead>
          <TableHead>Telefone</TableHead>
          <TableHead>CPF</TableHead>
          <TableHead>Status</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {patients.map((patient) => (
          <TableRow key={patient.id}>
            <TableCell>#{patient.code}</TableCell>
            <TableCell>{patient.socialName || patient.name}</TableCell>
            <TableCell>{patient.phonePrimary}</TableCell>
            <TableCell>{patient.cpf ?? '—'}</TableCell>
            <TableCell>
              <Badge variant={patient.active ? 'secondary' : 'outline'}>
                {patient.active ? 'Ativo' : 'Inativo'}
              </Badge>
            </TableCell>
            <TableCell>
              <Button type="button" variant="ghost" size="sm" onClick={() => onOpen(patient)}>
                Abrir
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
