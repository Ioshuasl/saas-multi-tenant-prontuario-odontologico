'use client';

import type { ChairSummary } from '@/packages/admin/types/Chair/ChairTypes';
import { MotionTableBody, MotionTableRow } from '@/shared/motion/MotionTable';
import { Button } from '@/shared/ui/button';
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';

type ChairTableProps = {
  chairs: ChairSummary[];
  onEdit: (chair: ChairSummary) => void;
};

export function ChairTable({ chairs, onEdit }: ChairTableProps) {
  if (chairs.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma cadeira cadastrada.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Cor</TableHead>
          <TableHead>Ativa</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <MotionTableBody>
        {chairs.map((chair) => (
          <MotionTableRow key={chair.id}>
            <TableCell>{chair.name}</TableCell>
            <TableCell>
              {chair.color ? (
                <span className="inline-flex items-center gap-2">
                  <span
                    className="inline-block size-3 rounded-full border"
                    style={{ backgroundColor: chair.color }}
                  />
                  {chair.color}
                </span>
              ) : (
                '—'
              )}
            </TableCell>
            <TableCell>{chair.active ? 'Sim' : 'Não'}</TableCell>
            <TableCell>
              <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(chair)}>
                Editar
              </Button>
            </TableCell>
          </MotionTableRow>
        ))}
      </MotionTableBody>
    </Table>
  );
}
