'use client';

import { operacionalErrorMessage } from '@/packages/operacional/helpers/OperacionalErrorMessage';
import {
  useGuardianCreateFormHook,
} from '@/packages/operacional/hooks/Patient/usePatientFormHook';
import { usePatientGuardianCreateHook } from '@/packages/operacional/hooks/Patient/usePatientGuardianCreateHook';
import type { GuardianCreateFormValues } from '@/packages/operacional/schemas/Patient/PatientSchema';
import type { LegalGuardianSummary } from '@/packages/operacional/types/Patient/PatientTypes';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';

type PatientGuardiansPanelProps = {
  patientId: string;
  guardians: LegalGuardianSummary[];
};

export function PatientGuardiansPanel({ patientId, guardians }: PatientGuardiansPanelProps) {
  const form = useGuardianCreateFormHook();
  const create = usePatientGuardianCreateHook(patientId);

  const onSubmit = async (values: GuardianCreateFormValues) => {
    await create.mutateAsync(values);
    form.reset();
  };

  return (
    <div className="grid max-w-2xl gap-6">
      {guardians.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum responsável cadastrado.</p>
      ) : (
        <ul className="grid gap-2">
          {guardians.map((g) => (
            <li key={g.id} className="rounded-md border px-3 py-2 text-sm">
              <p className="font-medium">{g.name}</p>
              <p className="text-muted-foreground">
                {[g.relationship, g.phone, g.cpf].filter(Boolean).join(' · ') || '—'}
              </p>
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
        <h2 className="text-sm font-medium">Adicionar responsável</h2>
        <FieldGroup>
          <Field data-invalid={Boolean(form.formState.errors.name)}>
            <FieldLabel htmlFor="guardian-name">Nome</FieldLabel>
            <Input id="guardian-name" {...form.register('name')} />
            <FieldError>{form.formState.errors.name?.message}</FieldError>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="guardian-rel">Parentesco</FieldLabel>
              <Input id="guardian-rel" {...form.register('relationship')} />
            </Field>
            <Field>
              <FieldLabel htmlFor="guardian-phone">Telefone</FieldLabel>
              <Input id="guardian-phone" {...form.register('phone')} />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="guardian-cpf">CPF</FieldLabel>
            <Input id="guardian-cpf" {...form.register('cpf')} />
          </Field>
        </FieldGroup>
        {create.isError ? (
          <Alert variant="destructive">
            <AlertDescription>{operacionalErrorMessage(create.error)}</AlertDescription>
          </Alert>
        ) : null}
        <Button type="submit" disabled={create.isPending} className="w-fit">
          {create.isPending ? 'Salvando…' : 'Adicionar'}
        </Button>
      </form>
    </div>
  );
}
