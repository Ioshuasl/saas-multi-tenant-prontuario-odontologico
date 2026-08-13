'use client';

import { useEffect, useState } from 'react';
import { operacionalErrorMessage } from '@/packages/operacional/helpers/OperacionalErrorMessage';
import { useScheduleBlockFormHook } from '@/packages/operacional/hooks/Appointment/useAppointmentFormHook';
import { useScheduleBlockCreateHook } from '@/packages/operacional/hooks/Appointment/useScheduleBlockCreateHook';
import type { ScheduleBlockFormValues } from '@/packages/operacional/schemas/Appointment/AppointmentSchema';
import type { ScheduleBlockFormDialogProps } from '@/packages/operacional/types/Appointment/ScheduleBlockFormDialogTypes';
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

export function ScheduleBlockFormDialog({
  open,
  professionalId,
  chairId,
  startsAt,
  endsAt,
  onClose,
}: ScheduleBlockFormDialogProps) {
  const form = useScheduleBlockFormHook({ startsAt, endsAt });
  const create = useScheduleBlockCreateHook();
  const [conflicts, setConflicts] = useState<
    Array<{ appointmentId: string; startsAt: string; endsAt: string }>
  >([]);

  const handleForm = () => {
    form.reset({ startsAt, endsAt, reason: '' });
    setConflicts([]);
  };

  useEffect(() => {
    handleForm();
  }, [startsAt, endsAt, form]);

  const onSubmit = async (values: ScheduleBlockFormValues) => {
    const result = await create.mutateAsync({
      professionalId: professionalId || null,
      chairId: chairId || null,
      startsAt: new Date(values.startsAt).toISOString(),
      endsAt: new Date(values.endsAt).toISOString(),
      reason: values.reason,
    });
    setConflicts(result.conflicts);
    if (result.conflicts.length === 0) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <MotionDialogBody>
          <DialogHeader>
            <DialogTitle>Bloquear horário</DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              void form.handleSubmit(onSubmit)(e);
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="block-start">Início</FieldLabel>
                <Input
                  id="block-start"
                  type="datetime-local"
                  {...form.register('startsAt')}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="block-end">Fim</FieldLabel>
                <Input id="block-end" type="datetime-local" {...form.register('endsAt')} />
              </Field>
              <Field data-invalid={Boolean(form.formState.errors.reason)}>
                <FieldLabel htmlFor="block-reason">Motivo</FieldLabel>
                <Input id="block-reason" {...form.register('reason')} />
                <FieldError>{form.formState.errors.reason?.message}</FieldError>
              </Field>
            </FieldGroup>

            {conflicts.length > 0 ? (
              <Alert role="alert">
                <AlertTitle>Conflitos (não cancelados)</AlertTitle>
                <AlertDescription>
                  {conflicts.length} agendamento(s) sobrepostos. O bloqueio foi criado; ajuste
                  manualmente se necessário.
                </AlertDescription>
              </Alert>
            ) : null}

            {create.isError ? (
              <Alert variant="destructive" role="alert">
                <AlertDescription>{operacionalErrorMessage(create.error)}</AlertDescription>
              </Alert>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                {conflicts.length > 0 ? 'Fechar' : 'Cancelar'}
              </Button>
              {conflicts.length === 0 ? (
                <Button type="submit" disabled={create.isPending}>
                  {create.isPending ? 'Salvando…' : 'Bloquear'}
                </Button>
              ) : null}
            </DialogFooter>
          </form>
        </MotionDialogBody>
      </DialogContent>
    </Dialog>
  );
}
