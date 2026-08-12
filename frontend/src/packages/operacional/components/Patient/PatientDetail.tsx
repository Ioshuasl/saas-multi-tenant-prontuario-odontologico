'use client';

import { useEffect, useState } from 'react';
import { PatientConsentsPanel } from '@/packages/operacional/components/Patient/PatientConsentsPanel';
import { PatientGuardiansPanel } from '@/packages/operacional/components/Patient/PatientGuardiansPanel';
import { PatientTimeline } from '@/packages/operacional/components/Patient/PatientTimeline';
import { operacionalErrorMessage } from '@/packages/operacional/helpers/OperacionalErrorMessage';
import { usePatientDeleteHook } from '@/packages/operacional/hooks/Patient/usePatientDeleteHook';
import { usePatientUpdateFormHook } from '@/packages/operacional/hooks/Patient/usePatientFormHook';
import { usePatientGetHook } from '@/packages/operacional/hooks/Patient/usePatientGetHook';
import { usePatientUpdateHook } from '@/packages/operacional/hooks/Patient/usePatientUpdateHook';
import type { PatientUpdateFormValues } from '@/packages/operacional/schemas/Patient/PatientSchema';
import { ApiClientError } from '@/shared/api/api-client';
import { FadeIn } from '@/shared/motion/FadeIn';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { NativeSelect, NativeSelectOption } from '@/shared/ui/native-select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Textarea } from '@/shared/ui/textarea';

type PatientDetailProps = {
  patientId: string;
};

export function PatientDetail({ patientId }: PatientDetailProps) {
  const patientQuery = usePatientGetHook(patientId);
  const form = usePatientUpdateFormHook();
  const update = usePatientUpdateHook(patientId);
  const deactivate = usePatientDeleteHook(patientId);
  const [confirmFuture, setConfirmFuture] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const patient = patientQuery.data;
    if (!patient) return;
    form.reset({
      name: patient.name,
      socialName: patient.socialName ?? '',
      cpf: patient.cpf ?? '',
      birthDate: patient.birthDate ?? '',
      sex: patient.sex ?? '',
      phonePrimary: patient.phonePrimary,
      phoneSecondary: patient.phoneSecondary ?? '',
      email: patient.email ?? '',
      notes: patient.notes ?? '',
      active: patient.active,
    });
  }, [patientQuery.data, form]);

  const onSave = async (values: PatientUpdateFormValues) => {
    setSaved(false);
    await update.mutateAsync(values);
    setSaved(true);
  };

  const onDeactivate = async () => {
    try {
      await deactivate.mutateAsync(confirmFuture);
      setConfirmFuture(false);
    } catch (error) {
      if (error instanceof ApiClientError && error.code === 'CONFIRMATION_REQUIRED') {
        setConfirmFuture(true);
      }
    }
  };

  if (patientQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando ficha…</p>;
  }

  if (patientQuery.isError || !patientQuery.data) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{operacionalErrorMessage(patientQuery.error)}</AlertDescription>
      </Alert>
    );
  }

  const patient = patientQuery.data;

  return (
    <FadeIn className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Ficha #{patient.code}</p>
          <h1 className="text-xl font-semibold">{patient.socialName || patient.name}</h1>
        </div>
        {patient.active ? (
          <Button
            type="button"
            variant="destructive"
            disabled={deactivate.isPending}
            onClick={() => {
              void onDeactivate();
            }}
          >
            {confirmFuture ? 'Confirmar inativação' : 'Inativar'}
          </Button>
        ) : null}
      </div>

      {confirmFuture ? (
        <Alert variant="destructive">
          <AlertTitle>Agendamentos futuros</AlertTitle>
          <AlertDescription>
            Este paciente possui agendamentos futuros. Clique novamente em “Confirmar inativação”
            para prosseguir.
          </AlertDescription>
        </Alert>
      ) : null}

      {patient.warnings.includes('MINOR_WITHOUT_GUARDIAN') ? (
        <Alert>
          <AlertDescription>
            Paciente menor sem responsável legal cadastrado.
          </AlertDescription>
        </Alert>
      ) : null}

      <Tabs defaultValue="dados">
        <TabsList>
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="responsaveis">Responsáveis</TabsTrigger>
          <TabsTrigger value="consentimentos">Consentimentos</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="mt-4">
          <form
            className="grid max-w-2xl gap-4"
            onSubmit={(e) => {
              void form.handleSubmit(onSave)(e);
            }}
          >
            <FieldGroup>
              <Field data-invalid={Boolean(form.formState.errors.name)}>
                <FieldLabel htmlFor="edit-name">Nome completo</FieldLabel>
                <Input id="edit-name" {...form.register('name')} />
                <FieldError>{form.formState.errors.name?.message}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="edit-social">Nome social</FieldLabel>
                <Input id="edit-social" {...form.register('socialName')} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field data-invalid={Boolean(form.formState.errors.phonePrimary)}>
                  <FieldLabel htmlFor="edit-phone">Telefone</FieldLabel>
                  <Input id="edit-phone" {...form.register('phonePrimary')} />
                  <FieldError>{form.formState.errors.phonePrimary?.message}</FieldError>
                </Field>
                <Field>
                  <FieldLabel htmlFor="edit-cpf">CPF</FieldLabel>
                  <Input id="edit-cpf" {...form.register('cpf')} />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="edit-birth">Nascimento</FieldLabel>
                  <Input id="edit-birth" type="date" {...form.register('birthDate')} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="edit-email">E-mail</FieldLabel>
                  <Input id="edit-email" type="email" {...form.register('email')} />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="edit-active">Status</FieldLabel>
                <NativeSelect
                  id="edit-active"
                  value={form.watch('active') ? 'true' : 'false'}
                  onChange={(e) => form.setValue('active', e.target.value === 'true')}
                >
                  <NativeSelectOption value="true">Ativo</NativeSelectOption>
                  <NativeSelectOption value="false">Inativo</NativeSelectOption>
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel htmlFor="edit-notes">Observações</FieldLabel>
                <Textarea id="edit-notes" rows={3} {...form.register('notes')} />
              </Field>
            </FieldGroup>

            {update.isError ? (
              <Alert variant="destructive">
                <AlertDescription>{operacionalErrorMessage(update.error)}</AlertDescription>
              </Alert>
            ) : null}
            {saved ? (
              <Alert>
                <AlertDescription>Alterações salvas.</AlertDescription>
              </Alert>
            ) : null}

            <Button type="submit" disabled={update.isPending} className="w-fit">
              {update.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="responsaveis" className="mt-4">
          <PatientGuardiansPanel patientId={patientId} guardians={patient.guardians} />
        </TabsContent>

        <TabsContent value="consentimentos" className="mt-4">
          <PatientConsentsPanel patientId={patientId} consents={patient.consents} />
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <PatientTimeline patientId={patientId} />
        </TabsContent>
      </Tabs>
    </FadeIn>
  );
}
