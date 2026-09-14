'use client';

import Link from 'next/link';
import {
  READ_ONLY_SUBSCRIPTION_STATUSES,
  SUBSCRIPTION_STATUS_LABELS,
  type SubscriptionStatus,
} from '@/packages/admin/enum/Subscription/SubscriptionStatusEnum';
import {
  USAGE_METRIC_LABELS,
  type UsageMetric,
} from '@/packages/admin/enum/Subscription/UsageMetricEnum';
import { adminErrorMessage } from '@/packages/admin/helpers/AdminErrorMessage';
import { formatBytes, formatCents } from '@/packages/admin/helpers/FormatCents';
import { useSubscriptionGetHook } from '@/packages/admin/hooks/Subscription/useSubscriptionGetHook';
import { useSubscriptionPlanListHook } from '@/packages/admin/hooks/Subscription/useSubscriptionPlanListHook';
import { useSubscriptionUsageGetHook } from '@/packages/admin/hooks/Subscription/useSubscriptionUsageGetHook';
import { useAuth } from '@/shared/auth/AuthProvider';
import { hasPermission } from '@/shared/auth/permissions';
import { ClivraPageHeader, ClivraSurface } from '@/shared/layout/ClivraPage';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';

function trialDaysLeft(trialEndsAt: string | null): number | null {
  if (!trialEndsAt) return null;
  const end = new Date(trialEndsAt).getTime();
  if (Number.isNaN(end)) return null;
  return Math.ceil((end - Date.now()) / (1000 * 60 * 60 * 24));
}

function formatUsageValue(metric: string, value: number): string {
  if (metric === 'storage_bytes') return formatBytes(value);
  return String(value);
}

function statusLabel(status: string): string {
  return SUBSCRIPTION_STATUS_LABELS[status as SubscriptionStatus] ?? status;
}

export function SubscriptionIndex() {
  const { me } = useAuth();
  const canManage = hasPermission(me, 'subscription.manage');
  const subscription = useSubscriptionGetHook(canManage);
  const plans = useSubscriptionPlanListHook(canManage);
  const usage = useSubscriptionUsageGetHook(canManage);

  if (!canManage) {
    return (
      <div className="grid min-w-0 gap-4" data-testid="subscription-page">
        <ClivraPageHeader
          title="Assinatura"
          description="Plano, uso e status do período de teste."
        />
        <Alert variant="destructive">
          <AlertDescription>Apenas o dono da clínica gerencia a assinatura.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const daysLeft = trialDaysLeft(subscription.data?.trialEndsAt ?? null);
  const isReadOnly =
    subscription.data != null &&
    READ_ONLY_SUBSCRIPTION_STATUSES.has(subscription.data.status);

  return (
    <div className="grid min-w-0 gap-4" data-testid="subscription-page">
      <ClivraPageHeader
        title="Assinatura"
        description="Plano, uso e status do período de teste. Ativação comercial é manual — sem checkout online."
      />

      {subscription.isLoading ? (
        <ClivraSurface contentClassName="px-4 py-6">
          <p className="text-sm text-muted-foreground">Carregando assinatura…</p>
        </ClivraSurface>
      ) : subscription.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{adminErrorMessage(subscription.error)}</AlertDescription>
        </Alert>
      ) : subscription.data ? (
        <>
          {isReadOnly ? (
            <Alert variant="destructive" data-testid="subscription-readonly-alert">
              <AlertTitle>Clínica em modo somente leitura</AlertTitle>
              <AlertDescription>
                A assinatura está {statusLabel(subscription.data.status).toLowerCase()}. Você ainda
                pode consultar dados e exportar relatórios; criar ou editar registros fica
                bloqueado até a reativação.
              </AlertDescription>
            </Alert>
          ) : null}

          {subscription.data.status === 'TRIAL' && daysLeft != null ? (
            <Alert data-testid="subscription-trial-alert">
              <AlertTitle>
                {daysLeft <= 0
                  ? 'Período de teste encerrado'
                  : `Restam ${daysLeft} dia${daysLeft === 1 ? '' : 's'} de teste`}
              </AlertTitle>
              <AlertDescription>
                Fale conosco para ativar o plano pago e manter o acesso completo.
              </AlertDescription>
            </Alert>
          ) : null}

          <ClivraSurface
            toolbar={
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  {subscription.data.plan.name}
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Status: {statusLabel(subscription.data.status)}
                  {subscription.data.trialEndsAt
                    ? ` · Teste até ${new Date(subscription.data.trialEndsAt).toLocaleDateString('pt-BR')}`
                    : ''}
                </p>
              </div>
            }
            contentClassName="grid gap-3 px-4 py-4"
          >
            <p className="text-sm text-foreground">
              Preço:{' '}
              <span className="font-semibold">
                {formatCents(subscription.data.plan.priceCents)}/{subscription.data.plan.interval}
              </span>
            </p>
            <a
              href="mailto:contato@orius.local?subject=Ativar%20assinatura"
              className="inline-flex h-10 w-fit cursor-pointer items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Falar para ativar
            </a>
          </ClivraSurface>
        </>
      ) : null}

      <ClivraSurface
        toolbar={
          <h2 className="text-sm font-semibold text-foreground">Uso atual</h2>
        }
        contentClassName="px-4 py-4"
      >
        {usage.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando uso…</p>
        ) : usage.isError ? (
          <Alert variant="destructive">
            <AlertDescription>{adminErrorMessage(usage.error)}</AlertDescription>
          </Alert>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {(usage.data?.items ?? []).map((item) => {
              const label =
                USAGE_METRIC_LABELS[item.metric as UsageMetric] ?? item.metric;
              const limitLabel =
                item.limit == null ? 'ilimitado' : formatUsageValue(item.metric, item.limit);
              return (
                <li
                  key={item.metric}
                  className="rounded-xl border border-border bg-background/60 px-3 py-2 text-sm"
                >
                  <span className="font-semibold text-foreground">{label}</span>
                  <span className="text-muted-foreground">
                    {' '}
                    · {formatUsageValue(item.metric, item.current)} / {limitLabel}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </ClivraSurface>

      <ClivraSurface
        toolbar={
          <h2 className="text-sm font-semibold text-foreground">Planos disponíveis</h2>
        }
        contentClassName="px-4 py-4"
      >
        {plans.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando planos…</p>
        ) : plans.isError ? (
          <Alert variant="destructive">
            <AlertDescription>{adminErrorMessage(plans.error)}</AlertDescription>
          </Alert>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(plans.data ?? []).map((plan) => (
              <div
                key={plan.id}
                className="rounded-xl border border-border bg-background/60 px-3 py-3"
              >
                <p className="font-semibold text-foreground">{plan.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatCents(plan.priceCents)}/{plan.interval}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Até {plan.limits.professionals ?? '∞'} profissionais ·{' '}
                  {plan.limits.adminUsers ?? '∞'} usuários · {plan.limits.units ?? '∞'} unidade(s)
                </p>
              </div>
            ))}
          </div>
        )}
      </ClivraSurface>

      <p className="text-sm text-muted-foreground">
        Dúvidas?{' '}
        <Link href="/app" className="underline underline-offset-4 hover:text-foreground">
          Voltar ao início
        </Link>
        .
      </p>
    </div>
  );
}
