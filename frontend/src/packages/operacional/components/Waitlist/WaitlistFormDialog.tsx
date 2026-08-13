'use client';

import { useDeferredValue, useEffect, useState } from 'react';
import { WAITLIST_WEEKDAYS } from '@/packages/operacional/enum/Waitlist/WaitlistStatusEnum';
import { operacionalErrorMessage } from '@/packages/operacional/helpers/OperacionalErrorMessage';
import { useAgendaProfessionalListHook } from '@/packages/operacional/hooks/Appointment/useAgendaProfessionalListHook';
import { usePatientListHook } from '@/packages/operacional/hooks/Patient/usePatientListHook';
import { useProcedureListHook } from '@/packages/operacional/hooks/Procedure/useProcedureListHook';
import { useWaitlistCreateHook } from '@/packages/operacional/hooks/Waitlist/useWaitlistCreateHook';
import { useWaitlistCreateFormHook } from '@/packages/operacional/hooks/Waitlist/useWaitlistFormHook';
import type { WaitlistCreateFormValues } from '@/packages/operacional/schemas/Waitlist/WaitlistSchema';
import type { WaitlistFormDialogProps } from '@/packages/operacional/types/Waitlist/WaitlistFormDialogTypes';
import { MotionDialogBody } from '@/shared/motion/MotionDialogBody';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
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

export function WaitlistFormDialog({ open, professionalId, onClose }: WaitlistFormDialogProps) {
  const form = useWaitlistCreateFormHook(professionalId);
  const create = useWaitlistCreateHook();
  const professionalsQuery = useAgendaProfessionalListHook();
  const proceduresQuery = useProcedureListHook();
  const [patientSearch, setPatientSearch] = useState('');
  const deferredSearch = useDeferredValue(patientSearch);
  const patientsQuery = usePatientListHook(deferredSearch);
  const anyTime = form.watch('anyTime');

  const handleForm = () => {
    form.reset({
      patientId: '',
      procedureId: '',
      professionalId: professionalId ?? '',
      priority: 0,
      anyTime: true,
      weekday: 1,
      from: '08:00',
      to: '12:00',
    });
    setPatientSearch('');
  };

  useEffect(() => {
    if (open) handleForm();
  }, [open, professionalId, form]);

  const onSave = async (values: WaitlistCreateFormValues) => {
    await create.mutateAsync({
      patientId: values.patientId,
      procedureId: values.procedureId,
      professionalId: values.professionalId ? values.professionalId : null,
      priority: values.priority,
      preferredPeriods: values.anyTime
        ? []
        : [{ weekday: values.weekday ?? 1, from: values.from ?? '08:00', to: values.to ?? '12:00' }],
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <MotionDialogBody>
          <DialogHeader>
            <DialogTitle>Fila de espera</DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              void form.handleSubmit(onSave)(event);
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="waitlist-patient-search">Paciente</FieldLabel>
                <Input
                  id="waitlist-patient-search"
                  placeholder="Buscar paciente…"
                  value={patientSearch}
                  onChange={(event) => setPatientSearch(event.target.value)}
                />
              </Field>
              <Field data-invalid={Boolean(form.formState.errors.patientId)}>
                <FieldLabel htmlFor="waitlist-patient">Selecionar</FieldLabel>
                <NativeSelect
                  id="waitlist-patient"
                  value={form.watch('patientId')}
                  onChange={(event) =>
                    form.setValue('patientId', event.target.value, { shouldValidate: true })
                  }
                >
                  <NativeSelectOption value="">Escolha…</NativeSelectOption>
                  {(patientsQuery.data?.items ?? []).map((patient) => (
                    <NativeSelectOption key={patient.id} value={patient.id}>
                      #{patient.code} {patient.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <FieldError>{form.formState.errors.patientId?.message}</FieldError>
              </Field>
              <Field data-invalid={Boolean(form.formState.errors.procedureId)}>
                <FieldLabel htmlFor="waitlist-procedure">Procedimento</FieldLabel>
                <NativeSelect
                  id="waitlist-procedure"
                  value={form.watch('procedureId')}
                  onChange={(event) =>
                    form.setValue('procedureId', event.target.value, { shouldValidate: true })
                  }
                >
                  <NativeSelectOption value="">Escolha…</NativeSelectOption>
                  {(proceduresQuery.data ?? [])
                    .filter((procedure) => procedure.active !== false)
                    .map((procedure) => (
                      <NativeSelectOption key={procedure.id} value={procedure.id}>
                        {procedure.name}
                      </NativeSelectOption>
                    ))}
                </NativeSelect>
                <FieldError>{form.formState.errors.procedureId?.message}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="waitlist-professional">Profissional (opcional)</FieldLabel>
                <NativeSelect
                  id="waitlist-professional"
                  value={form.watch('professionalId') ?? ''}
                  onChange={(event) => form.setValue('professionalId', event.target.value)}
                >
                  <NativeSelectOption value="">Qualquer profissional</NativeSelectOption>
                  {(professionalsQuery.data ?? []).map((professional) => (
                    <NativeSelectOption key={professional.id} value={professional.id}>
                      {professional.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel htmlFor="waitlist-priority">Prioridade</FieldLabel>
                <NativeSelect
                  id="waitlist-priority"
                  value={String(form.watch('priority'))}
                  onChange={(event) =>
                    form.setValue('priority', Number(event.target.value) === 1 ? 1 : 0)
                  }
                >
                  <NativeSelectOption value="0">Normal</NativeSelectOption>
                  <NativeSelectOption value="1">Urgente</NativeSelectOption>
                </NativeSelect>
              </Field>
              <Field>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="waitlist-anytime"
                    checked={anyTime}
                    onCheckedChange={(checked) => form.setValue('anyTime', checked === true)}
                  />
                  <FieldLabel htmlFor="waitlist-anytime" className="font-normal">
                    Qualquer horário
                  </FieldLabel>
                </div>
              </Field>
              {!anyTime ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field data-invalid={Boolean(form.formState.errors.weekday)}>
                    <FieldLabel htmlFor="waitlist-weekday">Dia</FieldLabel>
                    <NativeSelect
                      id="waitlist-weekday"
                      value={String(form.watch('weekday') ?? 1)}
                      onChange={(event) => form.setValue('weekday', Number(event.target.value))}
                    >
                      {WAITLIST_WEEKDAYS.map((day) => (
                        <NativeSelectOption key={day.value} value={String(day.value)}>
                          {day.label}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                    <FieldError>{form.formState.errors.weekday?.message}</FieldError>
                  </Field>
                  <Field data-invalid={Boolean(form.formState.errors.from)}>
                    <FieldLabel htmlFor="waitlist-from">De</FieldLabel>
                    <Input id="waitlist-from" type="time" {...form.register('from')} />
                    <FieldError>{form.formState.errors.from?.message}</FieldError>
                  </Field>
                  <Field data-invalid={Boolean(form.formState.errors.to)}>
                    <FieldLabel htmlFor="waitlist-to">Até</FieldLabel>
                    <Input id="waitlist-to" type="time" {...form.register('to')} />
                    <FieldError>{form.formState.errors.to?.message}</FieldError>
                  </Field>
                </div>
              ) : null}
            </FieldGroup>

            {create.isError ? (
              <Alert variant="destructive">
                <AlertDescription>{operacionalErrorMessage(create.error)}</AlertDescription>
              </Alert>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? 'Salvando…' : 'Adicionar à fila'}
              </Button>
            </DialogFooter>
          </form>
        </MotionDialogBody>
      </DialogContent>
    </Dialog>
  );
}
