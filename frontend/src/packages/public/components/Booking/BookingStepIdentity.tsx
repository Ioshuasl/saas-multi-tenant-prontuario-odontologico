'use client';

import type { UseFormReturn } from 'react-hook-form';
import type { BookingIdentityFormValues } from '@/packages/public/schemas/Booking/BookingSchema';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';

type BookingStepIdentityProps = {
  form: UseFormReturn<BookingIdentityFormValues>;
  pending: boolean;
  errorMessage?: string | null;
  onBack: () => void;
  onSave: (values: BookingIdentityFormValues) => void;
};

export function BookingStepIdentity({
  form,
  pending,
  errorMessage,
  onBack,
  onSave,
}: BookingStepIdentityProps) {
  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        void form.handleSubmit(onSave)(event);
      }}
    >
      <FieldGroup>
        <Field data-invalid={Boolean(form.formState.errors.name)}>
          <FieldLabel htmlFor="booking-name">Nome completo</FieldLabel>
          <Input id="booking-name" autoComplete="name" {...form.register('name')} />
          <FieldError>{form.formState.errors.name?.message}</FieldError>
        </Field>
        <Field data-invalid={Boolean(form.formState.errors.phone)}>
          <FieldLabel htmlFor="booking-phone">Telefone</FieldLabel>
          <Input
            id="booking-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            {...form.register('phone')}
          />
          <FieldError>{form.formState.errors.phone?.message}</FieldError>
        </Field>
        <Field data-invalid={Boolean(form.formState.errors.email)}>
          <FieldLabel htmlFor="booking-email">E-mail</FieldLabel>
          <Input
            id="booking-email"
            type="email"
            autoComplete="email"
            {...form.register('email')}
          />
          <FieldError>{form.formState.errors.email?.message}</FieldError>
        </Field>
        <Field data-invalid={Boolean(form.formState.errors.consentDataProcessing)}>
          <div className="flex items-start gap-2">
            <Checkbox
              id="booking-consent-data"
              checked={form.watch('consentDataProcessing')}
              onCheckedChange={(checked) => {
                form.setValue('consentDataProcessing', checked === true, { shouldValidate: true });
              }}
            />
            <FieldLabel htmlFor="booking-consent-data" className="font-normal">
              Aceito o tratamento dos meus dados pessoais
            </FieldLabel>
          </div>
          <FieldError>{form.formState.errors.consentDataProcessing?.message}</FieldError>
        </Field>
        <Field data-invalid={Boolean(form.formState.errors.consentTerms)}>
          <div className="flex items-start gap-2">
            <Checkbox
              id="booking-consent-terms"
              checked={form.watch('consentTerms')}
              onCheckedChange={(checked) => {
                form.setValue('consentTerms', checked === true, { shouldValidate: true });
              }}
            />
            <FieldLabel htmlFor="booking-consent-terms" className="font-normal">
              Aceito os termos de uso
            </FieldLabel>
          </div>
          <FieldError>{form.formState.errors.consentTerms?.message}</FieldError>
        </Field>
        <Field>
          <div className="flex items-start gap-2">
            <Checkbox
              id="booking-consent-marketing"
              checked={form.watch('consentWhatsappMarketing')}
              onCheckedChange={(checked) => {
                form.setValue('consentWhatsappMarketing', checked === true);
              }}
            />
            <FieldLabel htmlFor="booking-consent-marketing" className="font-normal">
              Quero receber novidades no WhatsApp (opcional)
            </FieldLabel>
          </div>
        </Field>
      </FieldGroup>

      {errorMessage ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? 'Enviando código…' : 'Enviar código'}
      </Button>
      <Button type="button" variant="ghost" className="w-full" onClick={onBack} disabled={pending}>
        Voltar
      </Button>
    </form>
  );
}
