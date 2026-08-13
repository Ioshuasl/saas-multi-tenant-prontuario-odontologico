'use client';

import { ROLE_LABELS, type Role } from '@/packages/admin/enum/RoleEnum';
import type { ProfessionalSummary } from '@/packages/admin/types/Professional/ProfessionalTypes';
import { Button } from '@/shared/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';

type ProfessionalTableProps = {
  professionals: ProfessionalSummary[];
  onEdit: (professional: ProfessionalSummary) => void;
};

export function ProfessionalTable({ professionals, onEdit }: ProfessionalTableProps) {
  if (professionals.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum profissional cadastrado.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>E-mail</TableHead>
          <TableHead>Papel</TableHead>
          <TableHead>CRO</TableHead>
          <TableHead>Especialidades</TableHead>
          <TableHead>Ativo</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {professionals.map((professional) => (
          <TableRow key={professional.id}>
            <TableCell>{professional.name}</TableCell>
            <TableCell>{professional.email}</TableCell>
            <TableCell>{ROLE_LABELS[professional.role as Role] ?? professional.role}</TableCell>
            <TableCell>
              {professional.croNumber
                ? `${professional.croNumber}${professional.croState ? `/${professional.croState}` : ''}`
                : '—'}
            </TableCell>
            <TableCell>{professional.specialties.join(', ') || '—'}</TableCell>
            <TableCell>{professional.active ? 'Sim' : 'Não'}</TableCell>
            <TableCell>
              <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(professional)}>
                Editar
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
