'use client';

import Link from 'next/link';
import {
  READ_ONLY_SUBSCRIPTION_STATUSES,
  SUBSCRIPTION_STATUS_LABELS,
  type SubscriptionStatus,
} from '@/packages/admin/enum/Subscription/SubscriptionStatusEnum';
import { useSubscriptionGetHook } from '@/packages/admin/hooks/Subscription/useSubscriptionGetHook';
import { useAuth } from '@/shared/auth/AuthProvider';
import { hasPermission } from '@/shared/auth/permissions';

function trialDaysLeft(trialEndsAt: string | null): number | null {
  if (!trialEndsAt) return null;
  const end = new Date(trialEndsAt).getTime();
  if (Number.isNaN(end)) return null;
  return Math.ceil((end - Date.now()) / (1000 * 60 * 60 * 24));
}

function statusLabel(status: string): string {
  return SUBSCRIPTION_STATUS_LABELS[status as SubscriptionStatus] ?? status;
}

/** Banner global: trial curto, atraso ou suspensão (só quem tem subscription.manage). */
export function SubscriptionBanner() {
  const { me } = useAuth();
  const canManage = hasPermission(me, 'subscription.manage');
  const subscription = useSubscriptionGetHook(canManage);

  if (!canManage || !subscription.data) return null;

  const { status, trialEndsAt } = subscription.data;
  const daysLeft = trialDaysLeft(trialEndsAt);
  const isReadOnly = READ_ONLY_SUBSCRIPTION_STATUSES.has(status);
  const trialWarning =
    status === 'TRIAL' && daysLeft != null && daysLeft <= 3;
  const pastDue = status === 'PAST_DUE';

  if (!isReadOnly && !trialWarning && !pastDue) return null;

  if (isReadOnly) {
    return (
      <div
        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3"
        data-testid="subscription-banner-readonly"
        role="status"
      >
        <div className="grid gap-1">
          <p className="text-sm font-medium">
            Conta {statusLabel(status).toLowerCase()} — somente leitura
          </p>
          <p className="text-xs text-muted-foreground">
            Consultas e exportações liberadas; alterações bloqueadas até reativar.
          </p>
        </div>
        <Link
          href="/app/assinatura"
          className="inline-flex h-8 items-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80"
        >
          Ver assinatura
        </Link>
      </div>
    );
  }

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3"
      data-testid="subscription-banner-trial"
      role="status"
    >
      <div className="grid gap-1">
        <p className="text-sm font-medium">
          {pastDue
            ? 'Pagamento em atraso'
            : daysLeft != null && daysLeft <= 0
              ? 'Período de teste encerrado'
              : `Teste termina em ${daysLeft} dia${daysLeft === 1 ? '' : 's'}`}
        </p>
        <p className="text-xs text-muted-foreground">
          Fale conosco para ativar o plano e evitar interrupção.
        </p>
      </div>
      <Link
        href="/app/assinatura"
        className="inline-flex h-8 items-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80"
      >
        Ver assinatura
      </Link>
    </div>
  );
}
