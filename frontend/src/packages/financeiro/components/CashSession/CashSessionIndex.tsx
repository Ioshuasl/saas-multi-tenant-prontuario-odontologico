'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { PAYMENT_METHOD_LABELS } from '@/packages/financeiro/enum/Payment/PaymentMethodEnum';
import { financeiroErrorMessage } from '@/packages/financeiro/helpers/FinanceiroErrorMessage';
import { formatCents } from '@/packages/financeiro/helpers/FormatCents';
import { useCashSessionCurrentGetHook } from '@/packages/financeiro/hooks/CashSession/useCashSessionCurrentGetHook';
import { useClinicDefaultUnitGetHook } from '@/packages/financeiro/hooks/Clinic/useClinicDefaultUnitGetHook';
import { Can } from '@/shared/auth/Can';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
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

const CashSessionOpenFormDialog = dynamic(
  () =>
    import('@/packages/financeiro/components/CashSession/CashSessionOpenFormDialog').then(
      (m) => m.CashSessionOpenFormDialog,
    ),
  { ssr: false },
);

const CashSessionCloseFormDialog = dynamic(
  () =>
    import('@/packages/financeiro/components/CashSession/CashSessionCloseFormDialog').then(
      (m) => m.CashSessionCloseFormDialog,
    ),
  { ssr: false },
);

const CashSessionMovementFormDialog = dynamic(
  () =>
    import('@/packages/financeiro/components/CashSession/CashSessionMovementFormDialog').then(
      (m) => m.CashSessionMovementFormDialog,
    ),
  { ssr: false },
);

export function CashSessionIndex() {
  const unitQuery = useClinicDefaultUnitGetHook();
  const unitId = unitQuery.data?.id;
  const currentQuery = useCashSessionCurrentGetHook(unitId);
  const [openDialog, setOpenDialog] = useState(false);
  const [closeDialog, setCloseDialog] = useState(false);
  const [moveDialog, setMoveDialog] = useState(false);

  if (unitQuery.isLoading || currentQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando caixa…</p>;
  }

  if (unitQuery.isError || !unitQuery.data) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {financeiroErrorMessage(unitQuery.error) || 'Unidade padrão não encontrada.'}
        </AlertDescription>
      </Alert>
    );
  }

  if (currentQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{financeiroErrorMessage(currentQuery.error)}</AlertDescription>
      </Alert>
    );
  }

  const session = currentQuery.data;
  const isOpen = session?.status === 'OPEN';

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Caixa do dia</h1>
          <p className="text-sm text-muted-foreground">{unitQuery.data.name}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!session ? (
            <Can permission="finance.write">
              <Button type="button" onClick={() => setOpenDialog(true)}>
                Abrir caixa
              </Button>
            </Can>
          ) : null}
          {isOpen ? (
            <>
              <Can permission="finance.write">
                <Button type="button" variant="outline" onClick={() => setMoveDialog(true)}>
                  Sangria / suprimento
                </Button>
              </Can>
              <Can permission="finance.close_cash">
                <Button type="button" onClick={() => setCloseDialog(true)}>
                  Fechar caixa
                </Button>
              </Can>
            </>
          ) : null}
        </div>
      </div>

      {!session ? (
        <p className="text-sm text-muted-foreground">Nenhuma sessão aberta nesta unidade.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{session.status === 'OPEN' ? 'Aberto' : 'Fechado'}</Badge>
            <span className="text-sm text-muted-foreground">
              Aberto há {session.openForHours.toFixed(1)} h · esperado{' '}
              {formatCents(session.expectedCents)}
            </span>
          </div>

          {session.openTooLong ? (
            <Alert>
              <AlertTitle>Sessão aberta há mais de 24 horas</AlertTitle>
              <AlertDescription>
                Revise o caixa e feche quando possível. O sistema não fecha automaticamente.
              </AlertDescription>
            </Alert>
          ) : null}

          {!isOpen ? (
            <Alert>
              <AlertTitle>Caixa fechado</AlertTitle>
              <AlertDescription>
                Sessão somente leitura. Movimentos ou baixas vinculadas retornam erro 423
                (imutável).
              </AlertDescription>
            </Alert>
          ) : null}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Forma</TableHead>
                <TableHead>Esperado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {session.expectedByMethod.map((row) => (
                <TableRow key={row.method}>
                  <TableCell>{PAYMENT_METHOD_LABELS[row.method]}</TableCell>
                  <TableCell>{formatCents(row.expectedCents)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div>
            <h2 className="mb-2 text-sm font-medium">Movimentos</h2>
            {session.movements.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum movimento ainda.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Forma</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Descrição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {session.movements.map((move) => (
                    <TableRow key={move.id}>
                      <TableCell>{move.kind}</TableCell>
                      <TableCell>{PAYMENT_METHOD_LABELS[move.method]}</TableCell>
                      <TableCell>{formatCents(move.amountCents)}</TableCell>
                      <TableCell>{move.description ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </>
      )}

      {openDialog && unitId ? (
        <CashSessionOpenFormDialog
          unitId={unitId}
          unitName={unitQuery.data.name}
          onClose={() => setOpenDialog(false)}
        />
      ) : null}
      {closeDialog && session ? (
        <CashSessionCloseFormDialog session={session} onClose={() => setCloseDialog(false)} />
      ) : null}
      {moveDialog && session ? (
        <CashSessionMovementFormDialog
          sessionId={session.id}
          onClose={() => setMoveDialog(false)}
        />
      ) : null}
    </div>
  );
}
