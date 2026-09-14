'use client';

import { useMemo } from 'react';
import {
  endOfDay,
  endOfMonth,
  format,
  getHours,
  startOfDay,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowUpIcon,
  BarChart3Icon,
  CalendarDaysIcon,
  CircleDollarSignIcon,
  ClipboardCheckIcon,
  TrendingDownIcon,
  UserIcon,
  XIcon,
} from 'lucide-react';
import { DashboardHero } from '@/packages/admin/components/Dashboard/DashboardHero';
import {
  DashboardMetricCards,
  MetricDotFooter,
  type DashboardMetric,
} from '@/packages/admin/components/Dashboard/DashboardMetricCards';
import { DashboardMiniCalendar } from '@/packages/admin/components/Dashboard/DashboardMiniCalendar';
import { DashboardQuickActions } from '@/packages/admin/components/Dashboard/DashboardQuickActions';
import { DashboardUpcomingAppointments } from '@/packages/admin/components/Dashboard/DashboardUpcomingAppointments';
import { adminErrorMessage } from '@/packages/admin/helpers/AdminErrorMessage';
import { formatCents } from '@/packages/admin/helpers/FormatCents';
import { useDashboardAppointmentListHook } from '@/packages/admin/hooks/Dashboard/useDashboardAppointmentListHook';
import { useOnboardingGetHook } from '@/packages/admin/hooks/Onboarding/useOnboardingGetHook';
import { useDashboardGetHook } from '@/packages/admin/hooks/Report/useDashboardGetHook';
import { useRevenueGetHook } from '@/packages/admin/hooks/Report/useRevenueGetHook';
import { useAuth } from '@/shared/auth/AuthProvider';
import { hasPermission } from '@/shared/auth/permissions';

function greetingLabel(now: Date): string {
  const hour = getHours(now);
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function displayFirstName(name: string | undefined, role: string | undefined): string {
  const part = name?.trim().split(/\s+/)[0];
  if (!part) return 'olá';
  if (role === 'DENTIST' || role === 'OWNER') {
    return `Dr. ${part}`;
  }
  return part;
}

function percentChange(today: number, yesterday: number): number | null {
  if (yesterday <= 0) return today > 0 ? 100 : 0;
  return Math.round(((today - yesterday) / yesterday) * 100);
}

export function DashboardHome() {
  const { user, me } = useAuth();
  const canFinancial = hasPermission(me, 'reports.financial');
  const canReports = hasPermission(me, 'reports.read');
  const canAgenda = hasPermission(me, 'agenda.read');

  const today = new Date();
  const todayKey = format(today, 'yyyy-MM-dd');
  const dayFrom = startOfDay(today).toISOString();
  const dayTo = endOfDay(today).toISOString();
  const monthFrom = startOfMonth(today).toISOString();
  const monthTo = endOfMonth(today).toISOString();
  const prevMonthEnd = endOfMonth(subMonths(today, 1));
  const prevMonthKey = format(prevMonthEnd, 'yyyy-MM-dd');

  const dashboard = useDashboardGetHook({}, canReports);
  const dashboardPrevMonth = useDashboardGetHook({ date: prevMonthKey }, canReports && canFinancial);
  const appointments = useDashboardAppointmentListHook(
    { from: dayFrom, to: dayTo },
    canAgenda,
  );
  const monthAppointments = useDashboardAppointmentListHook(
    { from: monthFrom, to: monthTo },
    canAgenda,
  );
  const revenueToday = useRevenueGetHook(
    { from: todayKey, to: todayKey, groupBy: 'day' },
    canFinancial,
  );
  const onboarding = useOnboardingGetHook();

  const role = me?.current.role;
  const firstName = displayFirstName(user?.name, role);
  const greet = greetingLabel(today);

  const showProfileCard = true;
  const profileHref = onboarding.data && !onboarding.data.completed
    ? '/app/onboarding'
    : '/app/configuracoes/clinica';

  const upcoming = useMemo(() => {
    return [...(appointments.data ?? [])]
      .filter((row) => row.status !== 'CANCELLED' && row.status !== 'NO_SHOW')
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
      .slice(0, 5);
  }, [appointments.data]);

  const appointmentDates = useMemo(() => {
    return Array.from(
      new Set((monthAppointments.data ?? []).map((row) => format(new Date(row.startsAt), 'yyyy-MM-dd'))),
    );
  }, [monthAppointments.data]);

  const agendaHref = dashboard.data?.drillDown.agenda ?? `/app/agenda?date=${todayKey}`;

  const metrics = useMemo((): DashboardMetric[] => {
    const data = dashboard.data;
    const byStatus = data?.agendaByStatus ?? {};
    const agendaTotal = Object.values(byStatus).reduce((sum, n) => sum + n, 0);
    const confirmed = (byStatus.CONFIRMED ?? 0) + (byStatus.CHECKED_IN ?? 0);
    const receivedCents = revenueToday.data?.totalCents ?? 0;
    const receivedCount =
      revenueToday.data?.buckets.reduce((sum, b) => sum + b.count, 0) ?? 0;
    const production = data?.productionMonthCents ?? 0;
    const prevProduction = dashboardPrevMonth.data?.productionMonthCents ?? 0;
    const productionDelta = percentChange(production, prevProduction);
    const noShows = data?.noShowsMonthCount ?? 0;

    const monthTotal = (monthAppointments.data ?? []).filter(
      (row) => row.status !== 'CANCELLED',
    ).length;
    const noShowPct =
      monthTotal > 0 ? Math.round((noShows / monthTotal) * 1000) / 10 : null;

    const list: DashboardMetric[] = [
      {
        id: 'agenda',
        title: 'Agenda de hoje',
        value: String(agendaTotal),
        valueHint: agendaTotal === 1 ? 'atendimento' : 'atendimentos',
        href: agendaHref,
        icon: CalendarDaysIcon,
        footer: (
          <MetricDotFooter color="green">
            {confirmed} confirmado{confirmed === 1 ? '' : 's'}
          </MetricDotFooter>
        ),
      },
    ];

    if (canFinancial) {
      list.push(
        {
          id: 'receber',
          title: 'A receber hoje',
          value: formatCents(data?.receivableTodayCents ?? 0),
          href: data?.drillDown.receivableToday ?? '/app/financeiro/receber',
          icon: CircleDollarSignIcon,
          footer: (
            <span className="inline-flex items-center gap-1.5">
              <UserIcon className="size-3 text-[#4A0F16]" strokeWidth={1.7} />
              {data?.receivableTodayCount ?? 0} paciente
              {(data?.receivableTodayCount ?? 0) === 1 ? '' : 's'}
            </span>
          ),
        },
        {
          id: 'recebido',
          title: 'Recebido hoje',
          value: formatCents(receivedCents),
          href: '/app/financeiro/receber',
          icon: ClipboardCheckIcon,
          footer: (
            <MetricDotFooter color="green">
              {receivedCount} pagamento{receivedCount === 1 ? '' : 's'}
            </MetricDotFooter>
          ),
        },
      );
    }

    list.push({
      id: 'faltas',
      title: 'Faltas no mês',
      value: String(noShows),
      href: data?.drillDown.noShows ?? '/app/relatorios/faltas',
      icon: XIcon,
      footer:
        noShowPct === null ? (
          <MetricDotFooter color="rose">registradas no mês</MetricDotFooter>
        ) : (
          <span className="inline-flex items-center gap-1.5">
            <TrendingDownIcon className="size-3 text-[#8A7F79]" strokeWidth={1.7} />
            {String(noShowPct).replace('.', ',')}% do total
          </span>
        ),
    });

    if (canFinancial || canReports) {
      list.push({
        id: 'producao',
        title: 'Produção do mês',
        value: formatCents(production),
        href: data?.drillDown.production ?? '/app/financeiro/producao',
        icon: BarChart3Icon,
        footer:
          productionDelta === null ? (
            <span>no mês atual</span>
          ) : productionDelta >= 0 ? (
            <span className="inline-flex items-center gap-1 text-emerald-700">
              <ArrowUpIcon className="size-3" />
              +{productionDelta}% em relação ao mês anterior
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-rose-700">
              {productionDelta}% em relação ao mês anterior
            </span>
          ),
      });
    }

    return list;
  }, [
    agendaHref,
    canFinancial,
    canReports,
    dashboard.data,
    dashboardPrevMonth.data,
    monthAppointments.data,
    revenueToday.data,
  ]);

  if (!canReports && !canAgenda) {
    return (
      <div className="rounded-2xl border border-[#EBE4DE] bg-white px-4 py-6 text-sm text-[#7A716C]">
        Seu perfil não tem acesso aos indicadores do painel.
      </div>
    );
  }

  return (
    <div className="grid min-w-0 gap-3.5">
      <DashboardHero
        greetingLabel={greet}
        firstName={firstName}
        showProfileCard={showProfileCard}
        profileHref={profileHref}
      />

      {dashboard.isError ? (
        <p className="text-sm text-rose-700" role="alert">
          {adminErrorMessage(dashboard.error)}
        </p>
      ) : null}

      {canReports || canFinancial ? (
        dashboard.isLoading ? (
          <p className="text-sm text-[#7A716C]">Carregando indicadores…</p>
        ) : (
          <DashboardMetricCards metrics={metrics} />
        )
      ) : null}

      <div className="grid min-w-0 gap-3 lg:grid-cols-[3.5fr_1.5fr] lg:items-stretch lg:gap-3">
        <DashboardUpcomingAppointments
          items={upcoming}
          agendaHref={agendaHref}
          loading={appointments.isLoading}
        />
        <div className="grid min-w-0 grid-rows-[1fr_auto] gap-2.5">
          <DashboardMiniCalendar appointmentDates={appointmentDates} selected={today} />
          <DashboardQuickActions />
        </div>
      </div>

      <p className="sr-only">
        Painel de {format(today, "EEEE, d 'de' MMMM", { locale: ptBR })}
      </p>
    </div>
  );
}
