'use client';

import { useState } from 'react';
import Link from 'next/link';
import { operacionalErrorMessage } from '@/packages/operacional/helpers/OperacionalErrorMessage';
import { usePatientCheckDuplicateHook } from '@/packages/operacional/hooks/Patient/usePatientCheckDuplicateHook';
import { usePatientCreateHook } from '@/packages/operacional/hooks/Patient/usePatientCreateHook';
import { usePatientCreateFormHook } from '@/packages/operacional/hooks/Patient/usePatientFormHook';
import type { PatientCreateFormValues } from '@/packages/operacional/schemas/Patient/PatientSchema';
import type { PatientFormDialogProps } from '@/packages/operacional/types/Patient/PatientFormDialogTypes';
import type { PatientDuplicateMatch } from '@/packages/operacional/types/Patient/PatientTypes';
import { ApiClientError } from '@/shared/api/api-client';
import { MotionDialogBody } from '@/shared/motion/MotionDialogBody';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';

export function PatientFormDialog({ open, onClose, onCreated }: PatientFormDialogProps) {
  const form = usePatientCreateFormHook();
  const create = usePatientCreateHook();
  const checkDup = usePatientCheckDuplicateHook();
  const [cpfBlock, setCpfBlock] = useState<PatientDuplicateMatch | null>(null);
  const [phoneWarning, setPhoneWarning] = useState<PatientDuplicateMatch[]>([]);
  const [createWarnings, setCreateWarnings] = useState<string[]>([]);

  const onCpfBlur = async () => {
    const cpf = form.getValues('cpf')?.trim();
    if (!cpf) {
      setCpfBlock(null);
      return;
    }
    const result = await checkDup.mutateAsync({ cpf });
    setCpfBlock(result.cpfMatch);
  };

  const onPhoneBlur = async () => {
    const phone = form.getValues('phonePrimary')?.trim();
    if (!phone || phone.length < 8) {
      setPhoneWarning([]);
      return;
    }
    const result = await checkDup.mutateAsync({ phone });
    setPhoneWarning(result.phoneMatches);
  };

  const onSubmit = async (values: PatientCreateFormValues) => {
    if (cpfBlock) return;
    try {
      const result = await create.mutateAsync(values);
      setCreateWarnings(result.warnings);
      onCreated?.(result.patient.id);
      onClose();
    } catch (error) {
      if (error instanceof ApiClientError && error.code === 'DUPLICATE_RESOURCE') {
        const details = error.details as { existingPatientId?: string; code?: number; name?: string };
        if (details?.existingPatientId) {
          setCpfBlock({
            id: details.existingPatientId,
            code: details.code ?? 0,
            name: details.name ?? 'Paciente',
            phonePrimary: '',
            cpf: values.cpf ?? null,
          });
        }
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <MotionDialogBody>
          <DialogHeader>
            <DialogTitle>Novo paciente</DialogTitle>
          </DialogHeader>

          <form
            className="grid gap-4"
            onSubmit={(e) => {
              void form.handleSubmit(onSubmit)(e);
            }}
          >
            <FieldGroup>
              <Field data-invalid={Boolean(form.formState.errors.name)}>
                <FieldLabel htmlFor="patient-name">Nome completo</FieldLabel>
                <Input id="patient-name" {...form.register('name')} />
                <FieldError>{form.formState.errors.name?.message}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="patient-social">Nome social</FieldLabel>
                <Input id="patient-social" {...form.register('socialName')} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field data-invalid={Boolean(form.formState.errors.phonePrimary)}>
                  <FieldLabel htmlFor="patient-phone">Telefone</FieldLabel>
                  <Input
                    id="patient-phone"
                    {...form.register('phonePrimary')}
                    onBlur={() => {
                      void onPhoneBlur();
                    }}
                  />
                  <FieldError>{form.formState.errors.phonePrimary?.message}</FieldError>
                </Field>
                <Field>
                  <FieldLabel htmlFor="patient-cpf">CPF</FieldLabel>
                  <Input
                    id="patient-cpf"
                    {...form.register('cpf')}
                    onBlur={() => {
                      void onCpfBlur();
                    }}
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="patient-birth">Nascimento</FieldLabel>
                  <Input id="patient-birth" type="date" {...form.register('birthDate')} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="patient-email">E-mail</FieldLabel>
                  <Input id="patient-email" type="email" {...form.register('email')} />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="patient-notes">Observações</FieldLabel>
                <Textarea id="patient-notes" rows={3} {...form.register('notes')} />
              </Field>
            </FieldGroup>

            {cpfBlock ? (
              <Alert variant="destructive">
                <AlertTitle>CPF já cadastrado</AlertTitle>
                <AlertDescription>
                  Ficha #{cpfBlock.code} — {cpfBlock.name}.{' '}
                  <Link className="underline" href={`/app/pacientes/${cpfBlock.id}`}>
                    Abrir ficha
                  </Link>
                </AlertDescription>
              </Alert>
            ) : null}

            {phoneWarning.length > 0 ? (
              <Alert>
                <AlertTitle>Possível duplicata por telefone</AlertTitle>
                <AlertDescription>
                  {phoneWarning.map((m) => `#${m.code} ${m.name}`).join(', ')}. Você ainda pode
                  salvar.
                </AlertDescription>
              </Alert>
            ) : null}

            {create.isError && !cpfBlock ? (
              <Alert variant="destructive">
                <AlertDescription>{operacionalErrorMessage(create.error)}</AlertDescription>
              </Alert>
            ) : null}

            {createWarnings.length > 0 ? (
              <Alert>
                <AlertDescription>{createWarnings.join(', ')}</AlertDescription>
              </Alert>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={create.isPending || Boolean(cpfBlock)}>
                {create.isPending ? 'Salvando…' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </MotionDialogBody>
      </DialogContent>
    </Dialog>
  );
}
