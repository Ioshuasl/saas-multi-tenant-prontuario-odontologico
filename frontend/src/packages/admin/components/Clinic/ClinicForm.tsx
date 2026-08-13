'use client';

import { useEffect } from 'react';
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
} from '@/packages/admin/enum/PaymentMethodEnum';
import { adminErrorMessage } from '@/packages/admin/helpers/AdminErrorMessage';
import { useClinicFormHook } from '@/packages/admin/hooks/Clinic/useClinicFormHook';
import { useClinicGetHook } from '@/packages/admin/hooks/Clinic/useClinicGetHook';
import { useClinicUpdateHook } from '@/packages/admin/hooks/Clinic/useClinicUpdateHook';
import type { ClinicUpdateFormValues } from '@/packages/admin/schemas/Clinic/ClinicSchema';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';

export function ClinicForm() {
  const clinicQuery = useClinicGetHook();
  const form = useClinicFormHook();
  const update = useClinicUpdateHook();

  useEffect(() => {
    const clinic = clinicQuery.data;
    if (!clinic) return;
    form.reset({
      name: clinic.name,
      legalName: clinic.legalName ?? '',
      taxId: clinic.taxId ?? '',
      responsibleCro: clinic.responsibleCro ?? '',
      timezone: clinic.timezone,
      acceptedPaymentMethods: clinic.acceptedPaymentMethods,
      phone: clinic.defaultUnit?.phone ?? '',
      address: {
        street: clinic.defaultUnit?.address?.street ?? '',
        number: clinic.defaultUnit?.address?.number ?? '',
        complement: clinic.defaultUnit?.address?.complement ?? '',
        district: clinic.defaultUnit?.address?.district ?? '',
        city: clinic.defaultUnit?.address?.city ?? '',
        state: clinic.defaultUnit?.address?.state ?? '',
        postalCode: clinic.defaultUnit?.address?.postalCode ?? '',
      },
    });
  }, [clinicQuery.data]);

  const onSave = async (values: ClinicUpdateFormValues) => {
    await update.mutateAsync(values);
  };

  if (clinicQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando…</p>;
  }

  if (clinicQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{adminErrorMessage(clinicQuery.error)}</AlertDescription>
      </Alert>
    );
  }

  return (
      <form
        className="mx-auto grid max-w-2xl gap-4"
        onSubmit={(e) => {
          void form.handleSubmit(onSave)(e);
        }}
      >
      <h1 className="text-xl font-semibold">Clínica</h1>
      <FieldGroup>
        <Field data-invalid={Boolean(form.formState.errors.name)}>
          <FieldLabel htmlFor="name">Nome</FieldLabel>
          <Input id="name" {...form.register('name')} />
          <FieldError>{form.formState.errors.name?.message}</FieldError>
        </Field>
        <Field data-invalid={Boolean(form.formState.errors.legalName)}>
          <FieldLabel htmlFor="legalName">Razão social</FieldLabel>
          <Input id="legalName" {...form.register('legalName')} />
          <FieldError>{form.formState.errors.legalName?.message}</FieldError>
        </Field>
        <Field data-invalid={Boolean(form.formState.errors.taxId)}>
          <FieldLabel htmlFor="taxId">CNPJ</FieldLabel>
          <Input id="taxId" {...form.register('taxId')} />
          <FieldError>{form.formState.errors.taxId?.message}</FieldError>
        </Field>
        <Field data-invalid={Boolean(form.formState.errors.responsibleCro)}>
          <FieldLabel htmlFor="responsibleCro">CRO responsável</FieldLabel>
          <Input id="responsibleCro" {...form.register('responsibleCro')} />
          <FieldError>{form.formState.errors.responsibleCro?.message}</FieldError>
        </Field>
        <Field data-invalid={Boolean(form.formState.errors.timezone)}>
          <FieldLabel htmlFor="timezone">Timezone</FieldLabel>
          <Input id="timezone" {...form.register('timezone')} />
          <FieldError>{form.formState.errors.timezone?.message}</FieldError>
        </Field>
        <Field data-invalid={Boolean(form.formState.errors.phone)}>
          <FieldLabel htmlFor="phone">Telefone</FieldLabel>
          <Input id="phone" {...form.register('phone')} />
          <FieldError>{form.formState.errors.phone?.message}</FieldError>
        </Field>
        <Field>
          <FieldLabel>Métodos de pagamento</FieldLabel>
          <div className="grid gap-2">
            {PAYMENT_METHODS.map((method) => (
              <label key={method} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  value={method}
                  {...form.register('acceptedPaymentMethods')}
                />
                {PAYMENT_METHOD_LABELS[method]}
              </label>
            ))}
          </div>
          <FieldError>{form.formState.errors.acceptedPaymentMethods?.message}</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor="street">Rua</FieldLabel>
          <Input id="street" {...form.register('address.street')} />
        </Field>
        <Field>
          <FieldLabel htmlFor="number">Número</FieldLabel>
          <Input id="number" {...form.register('address.number')} />
        </Field>
        <Field>
          <FieldLabel htmlFor="city">Cidade</FieldLabel>
          <Input id="city" {...form.register('address.city')} />
        </Field>
        <Field>
          <FieldLabel htmlFor="state">UF</FieldLabel>
          <Input id="state" maxLength={2} {...form.register('address.state')} />
        </Field>
        <Field>
          <FieldLabel htmlFor="postalCode">CEP</FieldLabel>
          <Input id="postalCode" {...form.register('address.postalCode')} />
        </Field>
      </FieldGroup>

      {update.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{adminErrorMessage(update.error)}</AlertDescription>
        </Alert>
      ) : null}
      {update.isSuccess ? (
        <Alert>
          <AlertDescription>Clínica atualizada.</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" disabled={update.isPending}>
        {update.isPending ? 'Salvando…' : 'Salvar'}
      </Button>
      </form>
  );
}
