'use client';

import { useDeferredValue, useEffect, useState } from 'react';
import { operacionalErrorMessage } from '@/packages/operacional/helpers/OperacionalErrorMessage';
import {
  useAppointmentCreateHook,
  useAppointmentSeriesCreateHook,
} from '@/packages/operacional/hooks/Appointment/useAppointmentCreateHook';
import { useAppointmentCreateFormHook } from '@/packages/operacional/hooks/Appointment/useAppointmentFormHook';
import { usePatientListHook } from '@/packages/operacional/hooks/Patient/usePatientListHook';
import type { AppointmentCreateFormValues } from '@/packages/operacional/schemas/Appointment/AppointmentSchema';
import type { AppointmentFormDialogProps } from '@/packages/operacional/types/Appointment/AppointmentFormDialogTypes';
import { MotionDialogBody } from '@/shared/motion/MotionDialogBody';
import { Alert, AlertDescription } from '@/shared/ui/alert';
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
import { NativeSelect, NativeSelectOption } from '@/shared/ui/native-select';

export function AppointmentFormDialog({
  open,
  professionalId,
  chairId,
  professionals = [],
  chairs = [],
  startsAt,
  endsAt,
  onClose,
}: AppointmentFormDialogProps) {
  const form = useAppointmentCreateFormHook({
    professionalId: professionalId ?? '',
    chairId: chairId ?? '',
    startsAt,
    endsAt,
  });
  const create = useAppointmentCreateHook();
  const createSeries = useAppointmentSeriesCreateHook();
  const [patientSearch, setPatientSearch] = useState('');
  const deferredSearch = useDeferredValue(patientSearch);
  const patientsQuery = usePatientListHook(deferredSearch);
  const lockProfessional = Boolean(professionalId) && !chairId;
  const lockChair = Boolean(chairId);

  const handleForm = () => {
    form.reset({
      patientId: '',
      professionalId: professionalId ?? '',
      chairId: chairId ?? '',
      startsAt,
      endsAt,
      notes: '',
      recurring: false,
      rruleFreq: 'WEEKLY',
    });
  };

  useEffect(() => {
    handleForm();
  }, [professionalId, chairId, startsAt, endsAt, form]);

  const onSubmit = async (values: AppointmentCreateFormValues) => {
    const nextChairId = values.chairId ? values.chairId : null;
    if (values.recurring) {
      const durationMinutes = Math.max(
        5,
        Math.round(
          (new Date(values.endsAt || endsAt).getTime() - new Date(values.startsAt).getTime()) /
            60000,
        ),
      );
      await createSeries.mutateAsync({
        patientId: values.patientId,
        professionalId: values.professionalId,
        chairId: nextChairId,
        startsAt: values.startsAt,
        durationMinutes,
        rrule: `FREQ=${values.rruleFreq ?? 'WEEKLY'};INTERVAL=1`,
        notes: values.notes,
      });
    } else {
      await create.mutateAsync({
        patientId: values.patientId,
        professionalId: values.professionalId,
        chairId: nextChairId,
        startsAt: values.startsAt,
        endsAt: values.endsAt || endsAt,
        notes: values.notes,
      });
    }
    onClose();
  };

  const pending = create.isPending || createSeries.isPending;
  const error = create.error ?? createSeries.error;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <MotionDialogBody>
          <DialogHeader>
            <DialogTitle>Novo agendamento</DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              void form.handleSubmit(onSubmit)(e);
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="appt-patient-search">Paciente</FieldLabel>
                <Input
                  id="appt-patient-search"
                  placeholder="Buscar paciente…"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                />
              </Field>
              <Field data-invalid={Boolean(form.formState.errors.patientId)}>
                <FieldLabel htmlFor="appt-patient">Selecionar</FieldLabel>
                <NativeSelect
                  id="appt-patient"
                  value={form.watch('patientId')}
                  onChange={(e) => form.setValue('patientId', e.target.value, { shouldValidate: true })}
                >
                  <NativeSelectOption value="">Escolha…</NativeSelectOption>
                  {(patientsQuery.data?.items ?? []).map((p) => (
                    <NativeSelectOption key={p.id} value={p.id}>
                      #{p.code} {p.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <FieldError>{form.formState.errors.patientId?.message}</FieldError>
              </Field>
              {!lockProfessional ? (
                <Field data-invalid={Boolean(form.formState.errors.professionalId)}>
                  <FieldLabel htmlFor="appt-professional">Profissional</FieldLabel>
                  <NativeSelect
                    id="appt-professional"
                    value={form.watch('professionalId')}
                    onChange={(e) =>
                      form.setValue('professionalId', e.target.value, { shouldValidate: true })
                    }
                  >
                    <NativeSelectOption value="">Escolha…</NativeSelectOption>
                    {professionals.map((p) => (
                      <NativeSelectOption key={p.id} value={p.id}>
                        {p.name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                  <FieldError>{form.formState.errors.professionalId?.message}</FieldError>
                </Field>
              ) : null}
              {!lockChair ? (
                <Field>
                  <FieldLabel htmlFor="appt-chair">Cadeira (opcional)</FieldLabel>
                  <NativeSelect
                    id="appt-chair"
                    value={form.watch('chairId') ?? ''}
                    onChange={(e) => form.setValue('chairId', e.target.value)}
                  >
                    <NativeSelectOption value="">Nenhuma</NativeSelectOption>
                    {chairs.map((c) => (
                      <NativeSelectOption key={c.id} value={c.id}>
                        {c.name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
              ) : null}
              <Field>
                <FieldLabel className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(form.watch('recurring'))}
                    onChange={(e) => form.setValue('recurring', e.target.checked)}
                  />
                  Recorrente (série)
                </FieldLabel>
              </Field>
              {form.watch('recurring') ? (
                <Field>
                  <FieldLabel htmlFor="appt-rrule">Frequência</FieldLabel>
                  <NativeSelect
                    id="appt-rrule"
                    value={form.watch('rruleFreq') ?? 'WEEKLY'}
                    onChange={(e) =>
                      form.setValue('rruleFreq', e.target.value as 'WEEKLY' | 'MONTHLY')
                    }
                  >
                    <NativeSelectOption value="WEEKLY">Semanal</NativeSelectOption>
                    <NativeSelectOption value="MONTHLY">Mensal</NativeSelectOption>
                  </NativeSelect>
                </Field>
              ) : null}
            </FieldGroup>

            {error ? (
              <Alert variant="destructive" role="alert">
                <AlertDescription>{operacionalErrorMessage(error)}</AlertDescription>
              </Alert>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? 'Salvando…' : 'Agendar'}
              </Button>
            </DialogFooter>
          </form>
        </MotionDialogBody>
      </DialogContent>
    </Dialog>
  );
}
