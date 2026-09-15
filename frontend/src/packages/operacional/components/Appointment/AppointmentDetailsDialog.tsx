'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  APPOINTMENT_STATUSES,
  APPOINTMENT_STATUS_META,
  SERIES_DELETE_SCOPES,
  type SeriesDeleteScope,
} from '@/packages/operacional/enum/Appointment/AppointmentStatusEnum';
import { operacionalErrorMessage } from '@/packages/operacional/helpers/OperacionalErrorMessage';
import { formatHour, parseInstant } from '@/packages/operacional/helpers/AgendaTime';
import {
  useAppointmentDeleteHook,
  useAppointmentSeriesDeleteHook,
  useAppointmentStatusHook,
} from '@/packages/operacional/hooks/Appointment/useAppointmentStatusHook';
import type { AppointmentSummary } from '@/packages/operacional/types/Appointment/AppointmentTypes';
import { Can } from '@/shared/auth/Can';
import { useSheetOpenState } from '@/shared/motion/useSheetOpenState';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Field, FieldLabel } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { NativeSelect, NativeSelectOption } from '@/shared/ui/native-select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui/sheet';

type AppointmentDetailsDialogProps = {
  appointment: AppointmentSummary | null;
  onClose: () => void;
};

export function AppointmentDetailsDialog({
  appointment,
  onClose,
}: AppointmentDetailsDialogProps) {
  const router = useRouter();
  const statusMutation = useAppointmentStatusHook();
  const deleteMutation = useAppointmentDeleteHook();
  const seriesDelete = useAppointmentSeriesDeleteHook();
  const [status, setStatus] = useState(appointment?.status ?? 'SCHEDULED');
  const [cancelReason, setCancelReason] = useState('');
  const [seriesScope, setSeriesScope] = useState<SeriesDeleteScope>('THIS');

  useEffect(() => {
    if (!appointment) return;
    setStatus(appointment.status);
    setCancelReason('');
    setSeriesScope('THIS');
  }, [appointment]);

  if (!appointment) return null;

  const start = parseInstant(appointment.startsAt);
  const end = parseInstant(appointment.endsAt);
  const statusMeta =
    APPOINTMENT_STATUS_META[
      (appointment.status in APPOINTMENT_STATUS_META
        ? appointment.status
        : 'SCHEDULED') as keyof typeof APPOINTMENT_STATUS_META
    ];

  const error = statusMutation.error ?? deleteMutation.error ?? seriesDelete.error;
  const { sheetOpen, requestClose, onOpenChange, onOpenChangeComplete } = useSheetOpenState(
    true,
    onClose,
  );

  const onStatus = async () => {
    await statusMutation.mutateAsync({
      appointmentId: appointment.id,
      statusSchema: { status },
    });
    requestClose();
  };

  const onCancel = async () => {
    if (!cancelReason.trim()) return;
    await deleteMutation.mutateAsync({
      appointmentId: appointment.id,
      reason: cancelReason.trim(),
    });
    requestClose();
  };

  const onSeriesDelete = async () => {
    if (!appointment.recurrenceId) return;
    await seriesDelete.mutateAsync({
      seriesId: appointment.recurrenceId,
      scope: seriesScope,
      appointmentId: appointment.id,
      reason: 'Exclusão pela agenda',
    });
    requestClose();
  };

  return (
    <Sheet
      open={sheetOpen}
      onOpenChange={onOpenChange}
      onOpenChangeComplete={onOpenChangeComplete}
    >
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-border px-4 py-4 text-left">
          <SheetTitle>{appointment.patient?.name ?? 'Agendamento'}</SheetTitle>
          <SheetDescription>
            {formatHour(start)}–{formatHour(end)} · {statusMeta.label}
            {appointment.procedure ? ` · ${appointment.procedure.name}` : ''}
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <div className="grid gap-4 text-sm text-foreground">
            <Can permission="clinical_records.read">
              {appointment.status === 'SCHEDULED' || appointment.status === 'CONFIRMED' ? (
                <Button
                  type="button"
                  className="cursor-pointer"
                  disabled={statusMutation.isPending}
                  onClick={() => {
                    void (async () => {
                      await statusMutation.mutateAsync({
                        appointmentId: appointment.id,
                        statusSchema: { status: 'IN_SERVICE' },
                      });
                      router.push(`/app/atendimento/${appointment.id}`);
                    })();
                  }}
                >
                  {statusMutation.isPending ? 'Iniciando…' : 'Iniciar atendimento'}
                </Button>
              ) : null}
              {appointment.status === 'IN_SERVICE' ? (
                <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => {
                    router.push(`/app/atendimento/${appointment.id}`);
                  }}
                >
                  Abrir atendimento
                </Button>
              ) : null}
            </Can>

            <Field>
              <FieldLabel htmlFor="appt-status">Status</FieldLabel>
              <NativeSelect
                id="appt-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {APPOINTMENT_STATUSES.filter((s) => s !== 'CANCELLED').map((s) => (
                  <NativeSelectOption key={s} value={s}>
                    {APPOINTMENT_STATUS_META[s].label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>

            <Button
              type="button"
              size="sm"
              className="cursor-pointer"
              disabled={statusMutation.isPending}
              onClick={() => {
                void onStatus();
              }}
            >
              Atualizar status
            </Button>

            <Field>
              <FieldLabel htmlFor="appt-cancel-reason">Cancelar (motivo)</FieldLabel>
              <Input
                id="appt-cancel-reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </Field>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              className="cursor-pointer"
              disabled={deleteMutation.isPending || !cancelReason.trim()}
              onClick={() => {
                void onCancel();
              }}
            >
              Cancelar agendamento
            </Button>

            {appointment.recurrenceId ? (
              <div className="grid gap-2 rounded-md border border-border p-3">
                <p className="text-xs font-medium text-muted-foreground">Série recorrente</p>
                <NativeSelect
                  value={seriesScope}
                  onChange={(e) => setSeriesScope(e.target.value as SeriesDeleteScope)}
                >
                  {SERIES_DELETE_SCOPES.map((scope) => (
                    <NativeSelectOption key={scope} value={scope}>
                      {scope === 'THIS'
                        ? 'Só esta'
                        : scope === 'FUTURE'
                          ? 'Esta e futuras'
                          : 'Todas'}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="cursor-pointer"
                  disabled={seriesDelete.isPending}
                  onClick={() => {
                    void onSeriesDelete();
                  }}
                >
                  Excluir série
                </Button>
              </div>
            ) : null}

            {error ? (
              <Alert variant="destructive" role="alert">
                <AlertDescription>{operacionalErrorMessage(error)}</AlertDescription>
              </Alert>
            ) : null}
          </div>
        </div>

        <SheetFooter className="border-t border-border px-4 py-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="cursor-pointer" onClick={requestClose}>
            Fechar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
