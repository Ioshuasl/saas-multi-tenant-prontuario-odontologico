'use client';

import Link from 'next/link';
import { CalendarDaysIcon, MoreVerticalIcon } from 'lucide-react';
import { format } from 'date-fns';
import type { DashboardAppointmentSummary } from '@/packages/admin/types/Dashboard/DashboardAppointmentTypes';
import { cn } from '@/shared/helpers/utils';

const STATUS_UI: Record<string, { label: string; className: string; dot: string }> = {
  CONFIRMED: {
    label: 'Confirmado',
    className: 'bg-[#E8F6EE] text-[#1F7A45]',
    dot: 'bg-[#1F7A45]',
  },
  SCHEDULED: {
    label: 'Aguardando',
    className: 'bg-[#FFF1E0] text-[#B86A00]',
    dot: 'bg-[#B86A00]',
  },
  REQUESTED: {
    label: 'Aguardando',
    className: 'bg-[#FFF1E0] text-[#B86A00]',
    dot: 'bg-[#B86A00]',
  },
  CHECKED_IN: {
    label: 'Aguardando',
    className: 'bg-[#FFF1E0] text-[#B86A00]',
    dot: 'bg-[#B86A00]',
  },
  IN_SERVICE: {
    label: 'Em atendimento',
    className: 'bg-[#FBF3DB] text-[#9F6B53]',
    dot: 'bg-[#9F6B53]',
  },
  COMPLETED: {
    label: 'Finalizado',
    className: 'bg-[#E8F6EE] text-[#1F7A45]',
    dot: 'bg-[#1F7A45]',
  },
  CANCELLED: {
    label: 'Cancelado',
    className: 'bg-[#FDEBEC] text-[#C14C4A]',
    dot: 'bg-[#C14C4A]',
  },
  NO_SHOW: {
    label: 'Falta',
    className: 'bg-[#FDEBEC] text-[#C14C4A]',
    dot: 'bg-[#C14C4A]',
  },
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
  }
  return (parts[0] ?? 'P').slice(0, 2).toUpperCase();
}

function formatPhone(phone: string | undefined): string {
  if (!phone) return '—';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

function professionalLabel(name: string | undefined): string {
  if (!name) return '—';
  const trimmed = name.trim();
  if (/^dr[a]?\.?\s/i.test(trimmed)) return trimmed;
  return `Dr(a). ${trimmed}`;
}

type DashboardUpcomingAppointmentsProps = {
  items: DashboardAppointmentSummary[];
  agendaHref: string;
  loading?: boolean;
};

export function DashboardUpcomingAppointments({
  items,
  agendaHref,
  loading,
}: DashboardUpcomingAppointmentsProps) {
  return (
    <section className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-[#EBE4DE] bg-white shadow-[0_1px_2px_rgb(74_15_22/0.04)]">
      <header className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5">
        <h2 className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#1A1A1A]">
          <CalendarDaysIcon className="size-3.5 text-[#4A0F16]" strokeWidth={1.7} />
          Próximos atendimentos
        </h2>
        <Link
          href={agendaHref}
          prefetch={false}
          className="text-[11px] font-medium text-[#4A0F16] transition-opacity hover:opacity-80"
        >
          Ver todos os atendimentos →
        </Link>
      </header>

      <div className="min-w-0 overflow-x-auto border-t border-[#F0EAE5]">
        <table className="w-full table-fixed border-collapse text-left">
          <colgroup>
            <col className="w-[4.25rem]" />
            <col className="w-[32%]" />
            <col />
            <col className="w-[6.5rem]" />
            <col className="w-9" />
          </colgroup>
          <thead>
            <tr className="text-[9px] font-semibold tracking-[0.1em] text-[#A39A94] uppercase">
              <th className="px-3 py-2 font-semibold">Horário</th>
              <th className="px-2 py-2 font-semibold">Paciente</th>
              <th className="px-2 py-2 font-semibold">Procedimento</th>
              <th className="px-2 py-2 font-semibold">Status</th>
              <th className="px-1 py-2" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-sm text-[#7A716C]">
                  Carregando…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-sm text-[#7A716C]">
                  Nenhum atendimento hoje.
                </td>
              </tr>
            ) : (
              items.map((row) => {
                const name = row.patient?.name ?? 'Paciente';
                const status = STATUS_UI[row.status] ?? {
                  label: row.status,
                  className: 'bg-[#F3EEE9] text-[#5C5652]',
                  dot: 'bg-[#5C5652]',
                };
                return (
                  <tr key={row.id} className="border-t border-[#F0EAE5]">
                    <td className="px-3 py-2.5 text-[12px] font-semibold tabular-nums text-[#1A1A1A]">
                      {format(new Date(row.startsAt), 'HH:mm')}
                    </td>
                    <td className="px-2 py-2.5">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#EFE8E2] text-[10px] font-semibold text-[#4A0F16]">
                          {initials(name)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[12px] font-semibold text-[#1A1A1A]">{name}</p>
                          <p className="truncate text-[10px] text-[#9A908A]">
                            {formatPhone(row.patient?.phonePrimary)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2.5">
                      <p className="truncate text-[12px] font-semibold text-[#1A1A1A]">
                        {row.procedure?.name ?? 'Consulta'}
                      </p>
                      <p className="truncate text-[10px] text-[#9A908A]">
                        {professionalLabel(row.professional?.name)}
                      </p>
                    </td>
                    <td className="px-2 py-2.5">
                      <span
                        className={cn(
                          'inline-flex max-w-full items-center gap-1 truncate rounded-full px-2 py-0.5 text-[10px] font-medium',
                          status.className,
                        )}
                      >
                        <span className={cn('size-1.5 shrink-0 rounded-full', status.dot)} aria-hidden />
                        <span className="truncate">{status.label}</span>
                      </span>
                    </td>
                    <td className="px-1 py-2.5 text-right">
                      <Link
                        href={`/app/agenda?appointmentId=${row.id}`}
                        prefetch={false}
                        className="inline-flex size-7 items-center justify-center rounded-lg text-[#9A908A] transition-colors hover:bg-[#F3EEE9] hover:text-[#4A0F16]"
                        aria-label="Abrir atendimento"
                      >
                        <MoreVerticalIcon className="size-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
