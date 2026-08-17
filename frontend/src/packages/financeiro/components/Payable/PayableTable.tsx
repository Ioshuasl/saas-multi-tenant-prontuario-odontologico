'use client';

import { PAYABLE_STATUS_LABELS } from '@/packages/financeiro/enum/Payable/PayableStatusEnum';
import { formatCents } from '@/packages/financeiro/helpers/FormatCents';
import type { PayableTableProps } from '@/packages/financeiro/types/Payable/PayableFormDialogTypes';
import { Can } from '@/shared/auth/Can';
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

export function PayableTable({ payables, categoryNames, onEdit, onPay }: PayableTableProps) {
  if (payables.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma conta a pagar.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Descrição</TableHead>
          <TableHead>Categoria</TableHead>
          <TableHead>Vencimento</TableHead>
          <TableHead>Valor</TableHead>
          <TableHead>Status</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {payables.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.description}</TableCell>
            <TableCell>
              {item.categoryId ? (categoryNames[item.categoryId] ?? '—') : '—'}
            </TableCell>
            <TableCell>{item.dueDate}</TableCell>
            <TableCell>{formatCents(item.amountCents)}</TableCell>
            <TableCell>
              <Badge variant="secondary">{PAYABLE_STATUS_LABELS[item.status]}</Badge>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap justify-end gap-1">
                {item.status === 'OPEN' || item.status === 'OVERDUE' ? (
                  <Can permission="finance.write">
                    <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(item)}>
                      Editar
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => onPay(item)}>
                      Pagar
                    </Button>
                  </Can>
                ) : null}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
