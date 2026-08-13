'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { addDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AgendaGrid } from '@/packages/operacional/components/Appointment/AgendaGrid';
import { AgendaToolbar } from '@/packages/operacional/components/Appointment/AgendaToolbar';
import type { SlotMinutes } from '@/packages/operacional/helpers/AgendaNotionTokens';
import {
  dayRange,
  rangeIso,
  toYmd,
  weekDays,
  weekRange,
} from '@/packages/operacional/helpers/AgendaTime';
import { operacionalErrorMessage } from '@/packages/operacional/helpers/OperacionalErrorMessage';
import { useAgendaChairListHook } from '@/packages/operacional/hooks/Appointment/useAgendaChairListHook';
import { useAgendaProfessionalListHook } from '@/packages/operacional/hooks/Appointment/useAgendaProfessionalListHook';
import { useAppointmentListHook } from '@/packages/operacional/hooks/Appointment/useAppointmentListHook';
import { useAppointmentUpdateHook } from '@/packages/operacional/hooks/Appointment/useAppointmentUpdateHook';
import type {
  AgendaResourceMode,
  AgendaViewMode,
  AppointmentSummary,
} from '@/packages/operacional/types/Appointment/AppointmentTypes';
import { ApiClientError } from '@/shared/api/api-client';
import { Alert, AlertDescription } from '@/shared/ui/alert';

const AppointmentDetailsDialog = dynamic(
  () =>
    import('@/packages/operacional/components/Appointment/AppointmentDetailsDialog').then(
      (m) => m.AppointmentDetailsDialog,
    ),
  { ssr: false },
);
const AppointmentFormDialog = dynamic(
  () =>
    import('@/packages/operacional/components/Appointment/AppointmentFormDialog').then(
      (m) => m.AppointmentFormDialog,
    ),
  { ssr: false },
);
const ScheduleBlockFormDialog = dynamic(
  () =>
    import('@/packages/operacional/components/Appointment/ScheduleBlockFormDialog').then(
      (m) => m.ScheduleBlockFormDialog,
    ),
  { ssr: false },
);

function toLocalInput(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

export function AgendaIndex() {
  const [viewMode, setViewMode] = useState<AgendaViewMode>('week');
  const [resourceMode, setResourceMode] = useState<AgendaResourceMode>('professional');
  const [anchor, setAnchor] = useState(() => new Date());
  const [slotMinutes, setSlotMinutes] = useState<SlotMinutes>(30);
  const [professionalId, setProfessionalId] = useState('');
  const [chairId, setChairId] = useState('');
  const [createSlot, setCreateSlot] = useState<{ startsAt: string; endsAt: string } | null>(
    null,
  );
  const [selected, setSelected] = useState<AppointmentSummary | null>(null);
  const [blockOpen, setBlockOpen] = useState(false);
  const [moveError, setMoveError] = useState<string | null>(null);

  const professionalsQuery = useAgendaProfessionalListHook();
  const chairsQuery = useAgendaChairListHook();
  const professionals = professionalsQuery.data ?? [];
  const chairs = chairsQuery.data ?? [];

  useEffect(() => {
    if (!professionalId && professionals[0]) {
      setProfessionalId(professionals[0].id);
    }
  }, [professionals, professionalId]);

  useEffect(() => {
    if (!chairId && chairs[0]) {
      setChairId(chairs[0].id);
    }
  }, [chairs, chairId]);

  const days = useMemo(
    () => (viewMode === 'week' ? weekDays(anchor) : [anchor]),
    [viewMode, anchor],
  );

  const { from, to } = useMemo(
    () => (viewMode === 'week' ? weekRange(anchor) : dayRange(anchor)),
    [viewMode, anchor],
  );
  const { from: fromIso, to: toIso } = rangeIso(from, to);

  const activeProfessionalId = resourceMode === 'professional' ? professionalId : undefined;
  const activeChairId = resourceMode === 'chair' ? chairId : undefined;
  const resourceReady = resourceMode === 'professional' ? Boolean(professionalId) : Boolean(chairId);

  const listQuery = useAppointmentListHook({
    professionalId: activeProfessionalId,
    chairId: activeChairId,
    from: fromIso,
    to: toIso,
    enabled: resourceReady,
  });

  const update = useAppointmentUpdateHook({
    professionalId: activeProfessionalId,
    chairId: activeChairId,
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

  const resourceError =
    resourceMode === 'professional' ? professionalsQuery.error : chairsQuery.error;
  const emptyResourceMessage =
    resourceMode === 'professional'
      ? 'Cadastre um profissional para visualizar a agenda.'
      : 'Cadastre uma cadeira para visualizar a agenda.';

  return (
    <div className="grid gap-4">
      <AgendaToolbar
        viewMode={viewMode}
        onViewMode={setViewMode}
        anchorLabel={anchorLabel}
        onPrev={() => setAnchor((d) => addDays(d, viewMode === 'week' ? -7 : -1))}
        onNext={() => setAnchor((d) => addDays(d, viewMode === 'week' ? 7 : 1))}
        onToday={() => setAnchor(new Date())}
        slotMinutes={slotMinutes}
        onSlotMinutes={setSlotMinutes}
        resourceMode={resourceMode}
        onResourceMode={setResourceMode}
        professionals={professionals}
        professionalId={professionalId}
        onProfessionalId={setProfessionalId}
        chairs={chairs}
        chairId={chairId}
        onChairId={setChairId}
        onBlock={() => setBlockOpen(true)}
      />

      {resourceError ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{operacionalErrorMessage(resourceError)}</AlertDescription>
        </Alert>
      ) : null}

      {!resourceReady ? (
        <p className="text-sm text-muted-foreground">{emptyResourceMessage}</p>
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
          showProfessional={resourceMode === 'chair'}
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
          professionalId={resourceMode === 'professional' ? professionalId : professionals[0]?.id}
          chairId={resourceMode === 'chair' ? chairId : undefined}
          professionals={professionals}
          chairs={chairs}
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
          professionalId={resourceMode === 'professional' ? professionalId : null}
          chairId={resourceMode === 'chair' ? chairId : null}
          startsAt={blockDefaults.startsAt}
          endsAt={blockDefaults.endsAt}
          onClose={() => setBlockOpen(false)}
        />
      ) : null}

      <p className="sr-only">
        Visão {viewMode} por {resourceMode === 'chair' ? 'cadeira' : 'profissional'} a partir de{' '}
        {toYmd(anchor)}
      </p>
    </div>
  );
}
