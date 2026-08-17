'use client';

import { useState } from 'react';
import { AGING_BAND_LABELS } from '@/packages/financeiro/enum/Report/AgingBandEnum';
import { RECEIPT_SEND_CHANNEL_LABELS } from '@/packages/financeiro/enum/Payment/ReceiptSendChannelEnum';
import { financeiroErrorMessage } from '@/packages/financeiro/helpers/FinanceiroErrorMessage';
import { formatCents } from '@/packages/financeiro/helpers/FormatCents';
import { useInstallmentChargeHook } from '@/packages/financeiro/hooks/Installment/useInstallmentChargeHook';
import { useOverdueGetHook } from '@/packages/financeiro/hooks/Report/useOverdueGetHook';
import { Can } from '@/shared/auth/Can';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';

export function OverdueIndex() {
  const report = useOverdueGetHook();
  const charge = useInstallmentChargeHook();
  const [copyText, setCopyText] = useState<string | null>(null);
  const [lastSent, setLastSent] = useState<string | null>(null);

  const onCharge = async (installmentId: string) => {
    setCopyText(null);
    const result = await charge.mutateAsync({
      installmentId,
      installmentChargeSchema: { channel: 'WHATSAPP' },
    });
    setLastSent(RECEIPT_SEND_CHANNEL_LABELS[result.sentVia]);
    if (result.copyText) setCopyText(result.copyText);
  };

  if (report.isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando inadimplência…</p>;
  }

  if (report.isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{financeiroErrorMessage(report.error)}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-4">
      <h1 className="text-xl font-semibold">Inadimplência</h1>

      {charge.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{financeiroErrorMessage(charge.error)}</AlertDescription>
        </Alert>
      ) : null}
      {lastSent ? (
        <Alert>
          <AlertDescription>Cobrança enviada via {lastSent}.</AlertDescription>
        </Alert>
      ) : null}
      {copyText ? (
        <Alert>
          <AlertDescription>{copyText}</AlertDescription>
        </Alert>
      ) : null}

      {(report.data?.buckets ?? []).map((bucket) => (
        <div key={bucket.band} className="grid gap-2">
          <h2 className="text-sm font-medium">
            {AGING_BAND_LABELS[bucket.band]} · {bucket.count} · {formatCents(bucket.totalCents)}
          </h2>
          {bucket.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum item nesta faixa.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Dias</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {bucket.items.map((item) => (
                  <TableRow key={item.installmentId}>
                    <TableCell>#{item.patientCode}</TableCell>
                    <TableCell>{item.dueDate}</TableCell>
                    <TableCell>{item.daysOverdue}</TableCell>
                    <TableCell>{formatCents(item.remainingCents)}</TableCell>
                    <TableCell>
                      <Can permission="finance.write">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={charge.isPending}
                          onClick={() => {
                            void onCharge(item.installmentId);
                          }}
                        >
                          Cobrar no WhatsApp
                        </Button>
                      </Can>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      ))}

      {(report.data?.buckets ?? []).every((b) => b.count === 0) ? (
        <p className="text-sm text-muted-foreground">Sem parcelas em atraso.</p>
      ) : null}
    </div>
  );
}
