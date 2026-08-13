'use client';

import { Controller, type UseFormReturn } from 'react-hook-form';
import type { BookingOtpFormValues } from '@/packages/public/schemas/Booking/BookingSchema';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Field, FieldError, FieldLabel } from '@/shared/ui/field';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/shared/ui/input-otp';

type BookingStepOtpProps = {
  form: UseFormReturn<BookingOtpFormValues>;
  sentVia: string;
  pending: boolean;
  errorMessage?: string | null;
  onBack: () => void;
  onSave: (values: BookingOtpFormValues) => void;
};

export function BookingStepOtp({
  form,
  sentVia,
  pending,
  errorMessage,
  onBack,
  onSave,
}: BookingStepOtpProps) {
  const channelLabel = sentVia === 'WHATSAPP' ? 'WhatsApp' : 'e-mail';

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        void form.handleSubmit(onSave)(event);
      }}
    >
      <p className="text-sm text-muted-foreground">
        Enviamos um código de 6 dígitos por {channelLabel}. Ele expira em 5 minutos.
      </p>

      <Field data-invalid={Boolean(form.formState.errors.code)}>
        <FieldLabel htmlFor="booking-otp">Código de verificação</FieldLabel>
        <Controller
          control={form.control}
          name="code"
          render={({ field }) => (
            <InputOTP
              id="booking-otp"
              maxLength={6}
              value={field.value}
              onChange={field.onChange}
              aria-label="Código de verificação"
              autoComplete="one-time-code"
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          )}
        />
        <FieldError>{form.formState.errors.code?.message}</FieldError>
      </Field>

      {errorMessage ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? 'Confirmando…' : 'Confirmar agendamento'}
      </Button>
      <Button type="button" variant="ghost" className="w-full" onClick={onBack} disabled={pending}>
        Voltar
      </Button>
    </form>
  );
}
