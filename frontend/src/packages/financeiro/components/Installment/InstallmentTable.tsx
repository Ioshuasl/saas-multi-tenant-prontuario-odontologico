'use client';

import {
  INSTALLMENT_PAYABLE_STATUSES,
  INSTALLMENT_STATUS_LABELS,
} from '@/packages/financeiro/enum/Installment/InstallmentStatusEnum';
import { formatCents } from '@/packages/financeiro/helpers/FormatCents';
import type { InstallmentTableProps } from '@/packages/financeiro/types/Installment/InstallmentTableTypes';
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

export function InstallmentTable({ installments, patientNames, onPay }: InstallmentTableProps) {
  if (installments.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma parcela encontrada.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Paciente</TableHead>
          <TableHead>Parcela</TableHead>
          <TableHead>Vencimento</TableHead>
          <TableHead>Valor</TableHead>
          <TableHead>Pago</TableHead>
          <TableHead>Saldo</TableHead>
          <TableHead>Status</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {installments.map((item) => {
          const balance = Math.max(0, item.amountCents - item.paidCents);
          const canPay = INSTALLMENT_PAYABLE_STATUSES.includes(item.status) && balance > 0;
          return (
            <TableRow key={item.id}>
              <TableCell>{patientNames[item.patientId] ?? 'Paciente'}</TableCell>
              <TableCell className="font-semibold">#{item.number}</TableCell>
              <TableCell>{item.dueDate}</TableCell>
              <TableCell>{formatCents(item.amountCents)}</TableCell>
              <TableCell>{formatCents(item.paidCents)}</TableCell>
              <TableCell>{formatCents(balance)}</TableCell>
              <TableCell>
                <Badge variant="secondary">{INSTALLMENT_STATUS_LABELS[item.status]}</Badge>
              </TableCell>
              <TableCell>
                {canPay ? (
                  <Can permission="finance.write">
                    <Button type="button" variant="ghost" size="sm" onClick={() => onPay(item)}>
                      Baixar
                    </Button>
                  </Can>
                ) : null}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
