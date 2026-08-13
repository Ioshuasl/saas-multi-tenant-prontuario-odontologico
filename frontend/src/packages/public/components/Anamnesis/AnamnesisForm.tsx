'use client';

import { useState } from 'react';
import { AnamnesisQuestions } from '@/packages/public/components/Anamnesis/AnamnesisQuestions';
import { AnamnesisShell } from '@/packages/public/components/Anamnesis/AnamnesisShell';
import { publicErrorMessage } from '@/packages/public/helpers/PublicErrorMessage';
import { useAnamnesisCreateHook } from '@/packages/public/hooks/Anamnesis/useAnamnesisCreateHook';
import { useAnamnesisGetHook } from '@/packages/public/hooks/Anamnesis/useAnamnesisGetHook';
import {
  toAnamnesisAnswersPayload,
  type AnamnesisAnswersFormValues,
} from '@/packages/public/schemas/Anamnesis/AnamnesisSchema';
import type { AnamnesisFormProps } from '@/packages/public/types/Anamnesis/AnamnesisFormTypes';
import { ApiClientError } from '@/shared/api/api-client';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

export function AnamnesisForm({ token }: AnamnesisFormProps) {
  const getQuery = useAnamnesisGetHook(token);
  const submit = useAnamnesisCreateHook();
  const [accepted, setAccepted] = useState(false);

  const onSave = async (values: AnamnesisAnswersFormValues) => {
    if (!getQuery.data) return;
    await submit.mutateAsync({
      token,
      answers: toAnamnesisAnswersPayload(getQuery.data.form.questions, values),
    });
    setAccepted(true);
  };

  if (!token) {
    return (
      <AnamnesisShell title="Anamnese">
        <Alert variant="destructive">
          <AlertDescription>Link inválido, expirado ou já utilizado.</AlertDescription>
        </Alert>
      </AnamnesisShell>
    );
  }

  if (getQuery.isLoading) {
    return (
      <AnamnesisShell title="Carregando…">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </AnamnesisShell>
    );
  }

  if (getQuery.isError || !getQuery.data) {
    const notFound = getQuery.error instanceof ApiClientError && getQuery.error.status === 404;
    return (
      <AnamnesisShell title="Anamnese">
        <Alert variant="destructive">
          <AlertDescription>
            {notFound
              ? 'Link inválido, expirado ou já utilizado.'
              : publicErrorMessage(getQuery.error)}
          </AlertDescription>
        </Alert>
        {!notFound ? (
          <Button type="button" size="lg" className="w-full" onClick={() => void getQuery.refetch()}>
            Tentar novamente
          </Button>
        ) : null}
      </AnamnesisShell>
    );
  }

  const data = getQuery.data;

  if (accepted) {
    return (
      <AnamnesisShell title={data.clinicName} description={`Olá, ${data.patientFirstName}.`}>
        <Alert>
          <AlertDescription>Anamnese enviada. Obrigado!</AlertDescription>
        </Alert>
      </AnamnesisShell>
    );
  }

  return (
    <AnamnesisShell
      title={data.clinicName}
      description={`${data.patientFirstName}, responda as perguntas de ${data.form.name} (v${data.form.version}).`}
    >
      <AnamnesisQuestions
        questions={data.form.questions}
        pending={submit.isPending}
        errorMessage={submit.isError ? publicErrorMessage(submit.error) : null}
        onSave={(values) => {
          void onSave(values);
        }}
      />
    </AnamnesisShell>
  );
}
