'use client';

import Link from 'next/link';
import { OnboardingBanner } from '@/packages/admin/components/Onboarding/OnboardingBanner';
import { adminErrorMessage } from '@/packages/admin/helpers/AdminErrorMessage';
import { formatCents } from '@/packages/admin/helpers/FormatCents';
import { useDashboardGetHook } from '@/packages/admin/hooks/Dashboard/useDashboardGetHook';
import { useAuth } from '@/shared/auth/AuthProvider';
import { hasPermission } from '@/shared/auth/permissions';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Agendado',
  CONFIRMED: 'Confirmado',
  CHECKED_IN: 'Check-in',
  IN_PROGRESS: 'Em atendimento',
  COMPLETED: 'Concluído',
  NO_SHOW: 'Falta',
  CANCELLED: 'Cancelado',
};

export function DashboardHome() {
  const { user, tenant, me } = useAuth();
  const canReadReports = hasPermission(me, 'reports.read');
  const dashboardQuery = useDashboardGetHook({}, canReadReports);

  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold">Olá{user?.name ? `, ${user.name}` : ''}</h1>
        <p className="text-sm text-muted-foreground">
          Indicadores de hoje{tenant?.name ? ` · ${tenant.name}` : ''}.
        </p>
      </div>
      <OnboardingBanner />

      {!canReadReports ? (
        <p className="text-sm text-muted-foreground">Sem permissão para ver os indicadores da clínica.</p>
      ) : dashboardQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando indicadores…</p>
      ) : dashboardQuery.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{adminErrorMessage(dashboardQuery.error)}</AlertDescription>
        </Alert>
      ) : dashboardQuery.data ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Agenda de hoje</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <p className="text-2xl font-semibold">{dashboardQuery.data.agenda.total}</p>
              <ul className="text-sm text-muted-foreground">
                {Object.entries(dashboardQuery.data.agenda.byStatus).map(([status, count]) => (
                  <li key={status}>
                    {STATUS_LABELS[status] ?? status}: {count}
                  </li>
                ))}
              </ul>
              <Button
                variant="link"
                className="h-auto w-fit px-0"
                nativeButton={false}
                render={<Link href={dashboardQuery.data.hrefs.agenda} prefetch={false} />}
              >
                Ver agenda
              </Button>
            </CardContent>
          </Card>

          {dashboardQuery.data.receivableToday ? (
            <Card>
              <CardHeader>
                <CardTitle>A receber hoje</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                <p className="text-2xl font-semibold">
                  {formatCents(dashboardQuery.data.receivableToday.amountCents)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {dashboardQuery.data.receivableToday.count} título(s)
                </p>
                <Button
                  variant="link"
                  className="h-auto w-fit px-0"
                  nativeButton={false}
                  render={<Link href={dashboardQuery.data.hrefs.receivableToday} prefetch={false} />}
                >
                  Ver inadimplência
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {dashboardQuery.data.receivedToday ? (
            <Card>
              <CardHeader>
                <CardTitle>Recebido hoje</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                <p className="text-2xl font-semibold">
                  {formatCents(dashboardQuery.data.receivedToday.amountCents)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {dashboardQuery.data.receivedToday.count} recebimento(s)
                </p>
                <Button
                  variant="link"
                  className="h-auto w-fit px-0"
                  nativeButton={false}
                  render={<Link href={dashboardQuery.data.hrefs.receivedToday} prefetch={false} />}
                >
                  Ver fluxo
                </Button>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Faltas no mês</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <p className="text-2xl font-semibold">{dashboardQuery.data.noShowsMonth.count}</p>
              <Button
                variant="link"
                className="h-auto w-fit px-0"
                nativeButton={false}
                render={<Link href={dashboardQuery.data.hrefs.noShowsMonth} prefetch={false} />}
              >
                Ver faltas
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Produção do mês</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <p className="text-2xl font-semibold">
                {formatCents(dashboardQuery.data.productionMonth.executedCents)}
              </p>
              <Button
                variant="link"
                className="h-auto w-fit px-0"
                nativeButton={false}
                render={<Link href={dashboardQuery.data.hrefs.productionMonth} prefetch={false} />}
              >
                Ver produção
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
