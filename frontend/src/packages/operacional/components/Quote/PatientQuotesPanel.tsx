'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { QuoteTable } from '@/packages/operacional/components/Quote/QuoteTable';
import { operacionalErrorMessage } from '@/packages/operacional/helpers/OperacionalErrorMessage';
import { usePatientGetHook } from '@/packages/operacional/hooks/Patient/usePatientGetHook';
import { useQuoteDuplicateHook } from '@/packages/operacional/hooks/Quote/useQuoteDuplicateHook';
import { useQuoteListHook } from '@/packages/operacional/hooks/Quote/useQuoteListHook';
import { useQuotePdfHook } from '@/packages/operacional/hooks/Quote/useQuotePdfHook';
import type { PatientQuotesPanelProps } from '@/packages/operacional/types/Quote/PatientQuotesPanelTypes';
import { Can } from '@/shared/auth/Can';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';

const QuoteFormDialog = dynamic(
  () =>
    import('@/packages/operacional/components/Quote/QuoteFormDialog').then(
      (m) => m.QuoteFormDialog,
    ),
  { ssr: false },
);

const QuoteSendFormDialog = dynamic(
  () =>
    import('@/packages/operacional/components/Quote/QuoteSendFormDialog').then(
      (m) => m.QuoteSendFormDialog,
    ),
  { ssr: false },
);

const QuoteDecisionFormDialog = dynamic(
  () =>
    import('@/packages/operacional/components/Quote/QuoteDecisionFormDialog').then(
      (m) => m.QuoteDecisionFormDialog,
    ),
  { ssr: false },
);

export function PatientQuotesPanel({ patientId }: PatientQuotesPanelProps) {
  const patientQuery = usePatientGetHook(patientId);
  const listQuery = useQuoteListHook({ patientId });
  const duplicate = useQuoteDuplicateHook();
  const pdf = useQuotePdfHook();
  const [formOpen, setFormOpen] = useState(false);
  const [formQuoteId, setFormQuoteId] = useState<string | undefined>();
  const [sendQuoteId, setSendQuoteId] = useState<string | null>(null);
  const [decideQuoteId, setDecideQuoteId] = useState<string | null>(null);

  const patientName = patientQuery.data
    ? patientQuery.data.socialName || patientQuery.data.name
    : 'Paciente';

  if (listQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando orçamentos…</p>;
  }

  if (listQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{operacionalErrorMessage(listQuery.error)}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium">Orçamentos</h2>
        <Can permission="quotes.write">
          <Button
            type="button"
            onClick={() => {
              setFormQuoteId(undefined);
              setFormOpen(true);
            }}
          >
            Novo orçamento
          </Button>
        </Can>
      </div>

      {duplicate.isError || pdf.isError ? (
        <Alert variant="destructive">
          <AlertDescription>
            {operacionalErrorMessage(duplicate.error ?? pdf.error)}
          </AlertDescription>
        </Alert>
      ) : null}

      <QuoteTable
        quotes={listQuery.data?.items ?? []}
        patientNames={{ [patientId]: patientName }}
        onEdit={(quote) => {
          setFormQuoteId(quote.id);
          setFormOpen(true);
        }}
        onSend={(quote) => setSendQuoteId(quote.id)}
        onDecide={(quote) => setDecideQuoteId(quote.id)}
        onDuplicate={(quote) => {
          void duplicate.mutateAsync(quote.id);
        }}
        onPdf={(quote) => {
          void pdf.mutateAsync(quote.id).then((result) => {
            window.open(result.url, '_blank', 'noopener,noreferrer');
          });
        }}
      />

      {formOpen ? (
        <QuoteFormDialog
          open={formOpen}
          quoteId={formQuoteId}
          patientId={patientId}
          onClose={() => setFormOpen(false)}
        />
      ) : null}
      {sendQuoteId ? (
        <QuoteSendFormDialog quoteId={sendQuoteId} onClose={() => setSendQuoteId(null)} />
      ) : null}
      {decideQuoteId ? (
        <QuoteDecisionFormDialog quoteId={decideQuoteId} onClose={() => setDecideQuoteId(null)} />
      ) : null}
    </div>
  );
}
