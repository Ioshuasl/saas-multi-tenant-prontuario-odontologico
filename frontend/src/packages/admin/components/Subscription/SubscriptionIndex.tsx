'use client';

import {
  SUBSCRIPTION_STATUS_LABELS,
} from '@/packages/admin/enum/Subscription/SubscriptionStatusEnum';
import { adminErrorMessage } from '@/packages/admin/helpers/AdminErrorMessage';
import { formatCents } from '@/packages/admin/helpers/FormatCents';
import { usePlanListHook } from '@/packages/admin/hooks/Subscription/usePlanListHook';
import { useSubscriptionGetHook } from '@/packages/admin/hooks/Subscription/useSubscriptionGetHook';
import { useUsageGetHook } from '@/packages/admin/hooks/Subscription/useUsageGetHook';
import type { UsageMetricSnapshot } from '@/packages/admin/types/Subscription/SubscriptionTypes';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

const USAGE_LABELS: Record<string, string> = {
  professionals: 'Profissionais',
  users: 'Usuários',
  units: 'Unidades',
  storageBytes: 'Armazenamento',
  messagesMonth: 'Mensagens no mês',
};

function formatUsage(metric: UsageMetricSnapshot, key: string): string {
  const current =
    key === 'storageBytes' ? `${(metric.current / (1024 * 1024 * 1024)).toFixed(2)} GB` : String(metric.current);
  const limit =
    metric.limit === null
      ? 'ilimitado'
      : key === 'storageBytes'
        ? `${(metric.limit / (1024 * 1024 * 1024)).toFixed(0)} GB`
        : String(metric.limit);
  return `${current} / ${limit}`;
}

export function SubscriptionIndex() {
  const subscriptionQuery = useSubscriptionGetHook();
  const plansQuery = usePlanListHook();
  const usageQuery = useUsageGetHook();

  if (subscriptionQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando assinatura…</p>;
  }

  if (subscriptionQuery.isError || !subscriptionQuery.data) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{adminErrorMessage(subscriptionQuery.error)}</AlertDescription>
      </Alert>
    );
  }

  const subscription = subscriptionQuery.data;
  const statusLabel = SUBSCRIPTION_STATUS_LABELS[subscription.status];

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-xl font-semibold">Assinatura</h1>
        <p className="text-sm text-muted-foreground">Plano atual, limites e status do trial.</p>
      </div>

      {!subscription.writable ? (
        <Alert>
          <AlertTitle>Somente leitura</AlertTitle>
          <AlertDescription>
            A clínica não pode criar ou alterar registros enquanto a assinatura estiver {statusLabel.toLowerCase()}.
            Listagens e exportação continuam disponíveis.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            Plano {subscription.plan.name}
            <Badge variant="outline">{statusLabel}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <p>{formatCents(subscription.plan.priceCents)} / mês</p>
          {subscription.status === 'TRIAL' && subscription.daysRemaining !== null ? (
            <p>{subscription.daysRemaining} dia(s) restantes de avaliação.</p>
          ) : null}
          <p className="text-muted-foreground">{subscription.contactMessage}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Uso do plano</CardTitle>
        </CardHeader>
        <CardContent>
          {usageQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando uso…</p>
          ) : usageQuery.isError ? (
            <Alert variant="destructive">
              <AlertDescription>{adminErrorMessage(usageQuery.error)}</AlertDescription>
            </Alert>
          ) : usageQuery.data ? (
            <ul className="grid gap-2 text-sm">
              {(
                [
                  ['professionals', usageQuery.data.professionals],
                  ['users', usageQuery.data.users],
                  ['units', usageQuery.data.units],
                  ['storageBytes', usageQuery.data.storageBytes],
                  ['messagesMonth', usageQuery.data.messagesMonth],
                ] as const
              ).map(([key, metric]) => (
                <li key={key} className="flex justify-between gap-2">
                  <span>{USAGE_LABELS[key]}</span>
                  <span>{formatUsage(metric, key)}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-3">
        {(plansQuery.data ?? []).map((plan) => (
          <Card key={plan.id} className={plan.id === subscription.plan.id ? 'ring-2 ring-primary' : undefined}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-1 text-sm">
              <p>{formatCents(plan.priceCents)} / mês</p>
              <p>Profissionais: {plan.limits.professionals ?? 'ilimitado'}</p>
              <p>Usuários: {plan.limits.users ?? 'ilimitado'}</p>
              <p>Unidades: {plan.limits.units ?? 'ilimitado'}</p>
              <p>Armazenamento: {plan.limits.storageGb ?? 'ilimitado'} GB</p>
              {plan.id === subscription.plan.id ? <p className="font-medium">Plano atual</p> : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
