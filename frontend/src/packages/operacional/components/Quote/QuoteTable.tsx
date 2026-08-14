'use client';

import {
  QUOTE_DUPLICATE_STATUSES,
  QUOTE_STATUS_LABELS,
} from '@/packages/operacional/enum/Quote/QuoteStatusEnum';
import { formatCents } from '@/packages/operacional/helpers/FormatCents';
import type { QuoteTableProps } from '@/packages/operacional/types/Quote/QuoteTableTypes';
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

export function QuoteTable({
  quotes,
  patientNames,
  onEdit,
  onSend,
  onDecide,
  onDuplicate,
  onPdf,
}: QuoteTableProps) {
  if (quotes.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum orçamento encontrado.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nº</TableHead>
          <TableHead>Paciente</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Validade</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {quotes.map((quote) => (
          <TableRow key={quote.id}>
            <TableCell className="font-semibold">{quote.number}</TableCell>
            <TableCell>{patientNames[quote.patientId] ?? 'Paciente'}</TableCell>
            <TableCell>
              <Badge variant="secondary">{QUOTE_STATUS_LABELS[quote.status]}</Badge>
            </TableCell>
            <TableCell>{formatCents(quote.totalCents)}</TableCell>
            <TableCell>{quote.validUntil ?? '—'}</TableCell>
            <TableCell>
              <div className="flex flex-wrap justify-end gap-1">
                {quote.status === 'DRAFT' ? (
                  <Can permission="quotes.write">
                    <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(quote)}>
                      Editar
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => onSend(quote)}>
                      Enviar
                    </Button>
                  </Can>
                ) : null}
                {quote.status === 'SENT' ? (
                  <Can permission="quotes.write">
                    <Button type="button" variant="ghost" size="sm" onClick={() => onDecide(quote)}>
                      Decidir
                    </Button>
                  </Can>
                ) : null}
                {QUOTE_DUPLICATE_STATUSES.includes(quote.status) ? (
                  <Can permission="quotes.write">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onDuplicate(quote)}
                    >
                      Duplicar
                    </Button>
                  </Can>
                ) : null}
                {quote.status !== 'DRAFT' ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => onPdf(quote)}>
                    PDF
                  </Button>
                ) : null}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
