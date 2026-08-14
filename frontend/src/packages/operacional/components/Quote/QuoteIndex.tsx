'use client';

import { useDeferredValue, useState } from 'react';
import dynamic from 'next/dynamic';
import type { QuoteStatus } from '@/packages/operacional/enum/Quote/QuoteStatusEnum';
import { QuoteFilter } from '@/packages/operacional/components/Quote/QuoteFilter';
import { QuoteTable } from '@/packages/operacional/components/Quote/QuoteTable';
import { operacionalErrorMessage } from '@/packages/operacional/helpers/OperacionalErrorMessage';
import { usePatientListHook } from '@/packages/operacional/hooks/Patient/usePatientListHook';
import { useQuoteDuplicateHook } from '@/packages/operacional/hooks/Quote/useQuoteDuplicateHook';
import { useQuoteListHook } from '@/packages/operacional/hooks/Quote/useQuoteListHook';
import { useQuotePdfHook } from '@/packages/operacional/hooks/Quote/useQuotePdfHook';
import { Can } from '@/shared/auth/Can';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { NativeSelect, NativeSelectOption } from '@/shared/ui/native-select';

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

export function QuoteIndex() {
  const [patientSearch, setPatientSearch] = useState('');
  const deferredSearch = useDeferredValue(patientSearch);
  const [status, setStatus] = useState<QuoteStatus | ''>('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [formQuoteId, setFormQuoteId] = useState<string | undefined>();
  const [formPatientId, setFormPatientId] = useState<string | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [sendQuoteId, setSendQuoteId] = useState<string | null>(null);
  const [decideQuoteId, setDecideQuoteId] = useState<string | null>(null);

  const patientsQuery = usePatientListHook(deferredSearch);
  const namesQuery = usePatientListHook('');
  const listQuery = useQuoteListHook({
    patientId: selectedPatientId || undefined,
    status: status || undefined,
  });
  const duplicate = useQuoteDuplicateHook();
  const pdf = useQuotePdfHook();

  const patientNames: Record<string, string> = {};
  for (const patient of [...(namesQuery.data?.items ?? []), ...(patientsQuery.data?.items ?? [])]) {
    patientNames[patient.id] = patient.socialName || patient.name;
  }

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
        <h1 className="text-xl font-semibold">Orçamentos</h1>
        <Can permission="quotes.write">
          <Button
            type="button"
            onClick={() => {
              setFormQuoteId(undefined);
              setFormPatientId(selectedPatientId || undefined);
              setFormOpen(true);
            }}
          >
            Novo orçamento
          </Button>
        </Can>
      </div>

      <QuoteFilter
        patientSearch={patientSearch}
        onPatientSearchChange={setPatientSearch}
        status={status}
        onStatusChange={setStatus}
      />

      {deferredSearch && (patientsQuery.data?.items.length ?? 0) > 0 ? (
        <NativeSelect
          aria-label="Paciente do filtro"
          className="max-w-md"
          value={selectedPatientId}
          onChange={(event) => setSelectedPatientId(event.target.value)}
        >
          <NativeSelectOption value="">Todos os pacientes</NativeSelectOption>
          {patientsQuery.data!.items.map((item) => (
            <NativeSelectOption key={item.id} value={item.id}>
              {item.socialName || item.name} (#{item.code})
            </NativeSelectOption>
          ))}
        </NativeSelect>
      ) : null}

      {duplicate.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{operacionalErrorMessage(duplicate.error)}</AlertDescription>
        </Alert>
      ) : null}
      {pdf.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{operacionalErrorMessage(pdf.error)}</AlertDescription>
        </Alert>
      ) : null}

      <QuoteTable
        quotes={listQuery.data?.items ?? []}
        patientNames={patientNames}
        onEdit={(quote) => {
          setFormQuoteId(quote.id);
          setFormPatientId(quote.patientId);
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
          patientId={formPatientId}
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
