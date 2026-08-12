'use client';

import { useEffect, useMemo, useState } from 'react';
import { addDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AgendaGrid } from '@/packages/operacional/components/Appointment/AgendaGrid';
import { AgendaToolbar } from '@/packages/operacional/components/Appointment/AgendaToolbar';
import { AppointmentDetailsDialog } from '@/packages/operacional/components/Appointment/AppointmentDetailsDialog';
import { AppointmentFormDialog } from '@/packages/operacional/components/Appointment/AppointmentFormDialog';
import { ScheduleBlockFormDialog } from '@/packages/operacional/components/Appointment/ScheduleBlockFormDialog';
import type { SlotMinutes } from '@/packages/operacional/helpers/AgendaNotionTokens';
import {
  dayRange,
  rangeIso,
  toYmd,
  weekDays,
  weekRange,
} from '@/packages/operacional/helpers/AgendaTime';
import { operacionalErrorMessage } from '@/packages/operacional/helpers/OperacionalErrorMessage';
import { useAgendaProfessionalListHook } from '@/packages/operacional/hooks/Appointment/useAgendaProfessionalListHook';
import { useAppointmentListHook } from '@/packages/operacional/hooks/Appointment/useAppointmentListHook';
import { useAppointmentUpdateHook } from '@/packages/operacional/hooks/Appointment/useAppointmentUpdateHook';
import type {
  AgendaViewMode,
  AppointmentSummary,
} from '@/packages/operacional/types/Appointment/AppointmentTypes';
import { ApiClientError } from '@/shared/api/api-client';
import { FadeIn } from '@/shared/motion/FadeIn';
import { Alert, AlertDescription } from '@/shared/ui/alert';

function toLocalInput(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

export function AgendaIndex() {
  const [viewMode, setViewMode] = useState<AgendaViewMode>('week');
  const [anchor, setAnchor] = useState(() => new Date());
  const [slotMinutes, setSlotMinutes] = useState<SlotMinutes>(30);
  const [professionalId, setProfessionalId] = useState('');
  const [createSlot, setCreateSlot] = useState<{ startsAt: string; endsAt: string } | null>(
    null,
  );
  const [selected, setSelected] = useState<AppointmentSummary | null>(null);
  const [blockOpen, setBlockOpen] = useState(false);
  const [moveError, setMoveError] = useState<string | null>(null);

  const professionalsQuery = useAgendaProfessionalListHook();
  const professionals = professionalsQuery.data ?? [];

  useEffect(() => {
    if (!professionalId && professionals[0]) {
      setProfessionalId(professionals[0].id);
    }
  }, [professionals, professionalId]);

  const days = useMemo(
    () => (viewMode === 'week' ? weekDays(anchor) : [anchor]),
    [viewMode, anchor],
  );

  const { from, to } = useMemo(
    () => (viewMode === 'week' ? weekRange(anchor) : dayRange(anchor)),
    [viewMode, anchor],
  );
  const { from: fromIso, to: toIso } = rangeIso(from, to);

  const listQuery = useAppointmentListHook({
    professionalId,
    from: fromIso,
    to: toIso,
    enabled: Boolean(professionalId),
  });

  const update = useAppointmentUpdateHook({
    professionalId,
    from: fromIso,
    to: toIso,
  });

  const appointments = (listQuery.data ?? []).filter(
    (a) => a.status !== 'CANCELLED' && a.status !== 'NO_SHOW',
  );

  const anchorLabel =
    viewMode === 'week'
      ? `${format(days[0]!, 'd MMM', { locale: ptBR })} – ${format(days[6]!, 'd MMM yyyy', { locale: ptBR })}`
      : format(anchor, "EEEE, d 'de' MMMM", { locale: ptBR });

  const onMoveOrResize = async (input: {
    appointmentId: string;
    startsAt: string;
    endsAt: string;
  }) => {
    setMoveError(null);
    try {
      await update.mutateAsync({
        appointmentId: input.appointmentId,
        appointmentSchema: {
          startsAt: input.startsAt,
          endsAt: input.endsAt,
        },
      });
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 409) {
        setMoveError(error.message || 'Horário indisponível — alteração desfeita.');
      } else {
        setMoveError(operacionalErrorMessage(error));
      }
    }
  };

  const blockDefaults = (() => {
    const day = days[0] ?? new Date();
    const start = new Date(day);
    start.setHours(12, 0, 0, 0);
    const end = new Date(day);
    end.setHours(13, 0, 0, 0);
    return { startsAt: toLocalInput(start), endsAt: toLocalInput(end) };
  })();

  return (
    <FadeIn className="grid gap-4">
      <AgendaToolbar
        viewMode={viewMode}
        onViewMode={setViewMode}
        anchorLabel={anchorLabel}
        onPrev={() => setAnchor((d) => addDays(d, viewMode === 'week' ? -7 : -1))}
        onNext={() => setAnchor((d) => addDays(d, viewMode === 'week' ? 7 : 1))}
        onToday={() => setAnchor(new Date())}
        slotMinutes={slotMinutes}
        onSlotMinutes={setSlotMinutes}
        professionals={professionals}
        professionalId={professionalId}
        onProfessionalId={setProfessionalId}
        onBlock={() => setBlockOpen(true)}
      />

      {professionalsQuery.isError ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>
            {operacionalErrorMessage(professionalsQuery.error)}
          </AlertDescription>
        </Alert>
      ) : null}

      {!professionalId ? (
        <p className="text-sm text-muted-foreground">
          Cadastre um profissional para visualizar a agenda.
        </p>
      ) : listQuery.isLoading ? (
        <div className="h-64 animate-pulse rounded-md bg-[#EFEFEF]" aria-hidden />
      ) : listQuery.isError ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{operacionalErrorMessage(listQuery.error)}</AlertDescription>
        </Alert>
      ) : (
        <AgendaGrid
          days={days}
          appointments={appointments}
          slotMinutes={slotMinutes}
          onSlotClick={(startsAt, endsAt) => {
            setCreateSlot({
              startsAt: startsAt.toISOString(),
              endsAt: endsAt.toISOString(),
            });
          }}
          onOpenAppointment={setSelected}
          onMoveOrResize={(input) => {
            void onMoveOrResize(input);
          }}
        />
      )}

      {moveError ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{moveError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-wrap gap-2 text-[11px] text-[#787774]">
        <span className="rounded bg-[#E7F3F8] px-2 py-0.5 text-[#0B6E99]">Agendado</span>
        <span className="rounded bg-[#EDF3EC] px-2 py-0.5 text-[#448361]">Confirmado</span>
        <span className="rounded bg-[#FBF3DB] px-2 py-0.5 text-[#9F6B53]">Em atendimento</span>
        <span className="rounded bg-[#FDEBEC] px-2 py-0.5 text-[#C14C4A]">Falta</span>
      </div>

      {createSlot ? (
        <AppointmentFormDialog
          open
          professionalId={professionalId}
          startsAt={createSlot.startsAt}
          endsAt={createSlot.endsAt}
          onClose={() => setCreateSlot(null)}
        />
      ) : null}

      {selected ? (
        <AppointmentDetailsDialog appointment={selected} onClose={() => setSelected(null)} />
      ) : null}

      {blockOpen ? (
        <ScheduleBlockFormDialog
          open
          professionalId={professionalId}
          startsAt={blockDefaults.startsAt}
          endsAt={blockDefaults.endsAt}
          onClose={() => setBlockOpen(false)}
        />
      ) : null}

      <p className="sr-only">
        Visão {viewMode} a partir de {toYmd(anchor)}
      </p>
    </FadeIn>
  );
}
