'use client';

import { useEffect } from 'react';
import { useFieldArray } from 'react-hook-form';
import { adminErrorMessage } from '@/packages/admin/helpers/AdminErrorMessage';
import { useBusinessHoursFormHook } from '@/packages/admin/hooks/BusinessHours/useBusinessHoursFormHook';
import { useBusinessHoursListHook } from '@/packages/admin/hooks/BusinessHours/useBusinessHoursListHook';
import { useBusinessHoursReplaceHook } from '@/packages/admin/hooks/BusinessHours/useBusinessHoursReplaceHook';
import { useClinicGetHook } from '@/packages/admin/hooks/Clinic/useClinicGetHook';
import type { BusinessHoursFormValues } from '@/packages/admin/schemas/BusinessHours/BusinessHoursSchema';
import { FadeIn } from '@/shared/motion/FadeIn';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { NativeSelect, NativeSelectOption } from '@/shared/ui/native-select';

const WEEKDAYS = [
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' },
];

export function BusinessHoursForm() {
  const clinicQuery = useClinicGetHook();
  const unitId = clinicQuery.data?.defaultUnit?.id;
  const hoursQuery = useBusinessHoursListHook(unitId);
  const form = useBusinessHoursFormHook();
  const replace = useBusinessHoursReplaceHook();
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'slots' });

  useEffect(() => {
    if (!hoursQuery.data) return;
    form.reset({
      slots: hoursQuery.data.map((slot) => ({
        weekday: slot.weekday,
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
      })),
    });
  }, [hoursQuery.data, form]);

  const onSave = async (values: BusinessHoursFormValues) => {
    if (!unitId) return;
    await replace.mutateAsync({
      unitId,
      professionalId: null,
      slots: values.slots,
    });
  };

  if (clinicQuery.isLoading || hoursQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando…</p>;
  }

  if (!unitId) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Configure a unidade padrão da clínica primeiro.</AlertDescription>
      </Alert>
    );
  }

  return (
    <FadeIn>
      <form
        className="mx-auto grid max-w-2xl gap-4"
        onSubmit={(e) => {
          void form.handleSubmit(onSave)(e);
        }}
      >
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Horários</h1>
        <Button
          type="button"
          variant="outline"
          onClick={() => append({ weekday: 1, startsAt: '08:00', endsAt: '12:00' })}
        >
          Adicionar slot
        </Button>
      </div>

      <FieldGroup>
        {fields.map((field, index) => (
          <div key={field.id} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
            <Field>
              <FieldLabel>Dia</FieldLabel>
              <NativeSelect {...form.register(`slots.${index}.weekday`, { valueAsNumber: true })}>
                {WEEKDAYS.map((day) => (
                  <NativeSelectOption key={day.value} value={day.value}>
                    {day.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field>
              <FieldLabel>Início</FieldLabel>
              <Input type="time" {...form.register(`slots.${index}.startsAt`)} />
            </Field>
            <Field>
              <FieldLabel>Fim</FieldLabel>
              <Input type="time" {...form.register(`slots.${index}.endsAt`)} />
            </Field>
            <div className="flex items-end">
              <Button type="button" variant="ghost" onClick={() => remove(index)}>
                Remover
              </Button>
            </div>
          </div>
        ))}
        <FieldError>{form.formState.errors.slots?.message}</FieldError>
      </FieldGroup>

      {replace.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{adminErrorMessage(replace.error)}</AlertDescription>
        </Alert>
      ) : null}
      {replace.isSuccess ? (
        <Alert>
          <AlertDescription>Horários atualizados.</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" disabled={replace.isPending}>
        {replace.isPending ? 'Salvando…' : 'Salvar horários'}
      </Button>
      </form>
    </FadeIn>
  );
}
