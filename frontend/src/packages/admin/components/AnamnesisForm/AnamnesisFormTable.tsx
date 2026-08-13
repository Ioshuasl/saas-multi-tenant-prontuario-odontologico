'use client';

import type { AnamnesisFormTableProps } from '@/packages/admin/types/AnamnesisForm/AnamnesisFormTableTypes';
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

export function AnamnesisFormTable({ forms, selectedId, onSelect }: AnamnesisFormTableProps) {
  if (forms.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum formulário de anamnese.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Versão</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Perguntas</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {forms.map((form) => (
          <TableRow key={form.id} data-state={form.id === selectedId ? 'selected' : undefined}>
            <TableCell>{form.name}</TableCell>
            <TableCell>v{form.version}</TableCell>
            <TableCell>
              <Badge variant={form.active ? 'secondary' : 'outline'}>
                {form.active ? 'Ativa' : 'Anterior'}
              </Badge>
            </TableCell>
            <TableCell>{form.questions.length}</TableCell>
            <TableCell>
              <Button type="button" variant="ghost" size="sm" onClick={() => onSelect(form)}>
                Ver
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
