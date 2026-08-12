'use client';

import {
  CONSENT_CHANNEL_LABELS,
  CONSENT_CHANNELS,
  CONSENT_TYPE_LABELS,
  CONSENT_TYPES,
} from '@/packages/operacional/enum/Patient/ConsentEnum';
import { operacionalErrorMessage } from '@/packages/operacional/helpers/OperacionalErrorMessage';
import { usePatientConsentCreateHook } from '@/packages/operacional/hooks/Patient/usePatientConsentCreateHook';
import { useConsentCreateFormHook } from '@/packages/operacional/hooks/Patient/usePatientFormHook';
import type { ConsentCreateFormValues } from '@/packages/operacional/schemas/Patient/PatientSchema';
import type { ConsentSummary } from '@/packages/operacional/types/Patient/PatientTypes';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { NativeSelect, NativeSelectOption } from '@/shared/ui/native-select';

type PatientConsentsPanelProps = {
  patientId: string;
  consents: ConsentSummary[];
};

export function PatientConsentsPanel({ patientId, consents }: PatientConsentsPanelProps) {
  const form = useConsentCreateFormHook();
  const create = usePatientConsentCreateHook(patientId);

  const onSubmit = async (values: ConsentCreateFormValues) => {
    await create.mutateAsync(values);
  };

  const onRevoke = async (consent: ConsentSummary) => {
    await create.mutateAsync({
      type: consent.type as ConsentCreateFormValues['type'],
      granted: false,
      documentVersion: consent.documentVersion,
      channel: consent.channel as ConsentCreateFormValues['channel'],
    });
  };

  return (
    <div className="grid max-w-2xl gap-6">
      {consents.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum consentimento registrado.</p>
      ) : (
        <ul className="grid gap-2">
          {consents.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium">
                  {CONSENT_TYPE_LABELS[c.type as keyof typeof CONSENT_TYPE_LABELS] ?? c.type}
                </p>
                <p className="text-muted-foreground">
                  {CONSENT_CHANNEL_LABELS[c.channel as keyof typeof CONSENT_CHANNEL_LABELS] ??
                    c.channel}{' '}
                  · {c.documentVersion}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={c.granted && !c.revokedAt ? 'secondary' : 'outline'}>
                  {c.granted && !c.revokedAt ? 'Ativo' : 'Revogado'}
                </Badge>
                {c.granted && !c.revokedAt ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={create.isPending}
                    onClick={() => {
                      void onRevoke(c);
                    }}
                  >
                    Revogar
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        className="grid gap-4"
        onSubmit={(e) => {
          void form.handleSubmit(onSubmit)(e);
        }}
      >
        <h2 className="text-sm font-medium">Registrar consentimento</h2>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="consent-type">Tipo</FieldLabel>
            <NativeSelect
              id="consent-type"
              value={form.watch('type')}
              onChange={(e) =>
                form.setValue('type', e.target.value as ConsentCreateFormValues['type'])
              }
            >
              {CONSENT_TYPES.map((type) => (
                <NativeSelectOption key={type} value={type}>
                  {CONSENT_TYPE_LABELS[type]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          <Field>
            <FieldLabel htmlFor="consent-channel">Canal</FieldLabel>
            <NativeSelect
              id="consent-channel"
              value={form.watch('channel')}
              onChange={(e) =>
                form.setValue('channel', e.target.value as ConsentCreateFormValues['channel'])
              }
            >
              {CONSENT_CHANNELS.map((channel) => (
                <NativeSelectOption key={channel} value={channel}>
                  {CONSENT_CHANNEL_LABELS[channel]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          <Field data-invalid={Boolean(form.formState.errors.documentVersion)}>
            <FieldLabel htmlFor="consent-version">Versão do documento</FieldLabel>
            <Input id="consent-version" {...form.register('documentVersion')} />
            <FieldError>{form.formState.errors.documentVersion?.message}</FieldError>
          </Field>
        </FieldGroup>
        {create.isError ? (
          <Alert variant="destructive">
            <AlertDescription>{operacionalErrorMessage(create.error)}</AlertDescription>
          </Alert>
        ) : null}
        <Button type="submit" disabled={create.isPending} className="w-fit">
          {create.isPending ? 'Salvando…' : 'Registrar'}
        </Button>
      </form>
    </div>
  );
}
