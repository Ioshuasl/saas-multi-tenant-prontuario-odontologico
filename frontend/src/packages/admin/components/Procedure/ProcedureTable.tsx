'use client';

import type { ProcedureSummary } from '@/packages/admin/types/Procedure/ProcedureTypes';
import { MotionTableBody, MotionTableRow } from '@/shared/motion/MotionTable';
import { Button } from '@/shared/ui/button';
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';

type ProcedureTableProps = {
  procedures: ProcedureSummary[];
  onEdit: (procedure: ProcedureSummary) => void;
};

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function ProcedureTable({ procedures, onEdit }: ProcedureTableProps) {
  if (procedures.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum procedimento cadastrado.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Código</TableHead>
          <TableHead>Nome</TableHead>
          <TableHead>Especialidade</TableHead>
          <TableHead>Duração</TableHead>
          <TableHead>Preço</TableHead>
          <TableHead>Ativo</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <MotionTableBody>
        {procedures.map((procedure) => (
          <MotionTableRow key={procedure.id}>
            <TableCell>{procedure.code}</TableCell>
            <TableCell>{procedure.name}</TableCell>
            <TableCell>{procedure.specialty ?? '—'}</TableCell>
            <TableCell>{procedure.defaultMinutes} min</TableCell>
            <TableCell>{formatPrice(procedure.priceCents)}</TableCell>
            <TableCell>{procedure.active ? 'Sim' : 'Não'}</TableCell>
            <TableCell>
              <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(procedure)}>
                Editar
              </Button>
            </TableCell>
          </MotionTableRow>
        ))}
      </MotionTableBody>
    </Table>
  );
}
