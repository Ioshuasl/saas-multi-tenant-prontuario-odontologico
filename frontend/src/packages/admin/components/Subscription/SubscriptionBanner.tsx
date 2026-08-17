'use client';

import Link from 'next/link';
import {
  SUBSCRIPTION_STATUS_LABELS,
} from '@/packages/admin/enum/Subscription/SubscriptionStatusEnum';
import { useAuth } from '@/shared/auth/AuthProvider';
import { hasPermission } from '@/shared/auth/permissions';
import { useSubscriptionGetHook } from '@/packages/admin/hooks/Subscription/useSubscriptionGetHook';
import { Alert, AlertDescription } from '@/shared/ui/alert';

function isAlertStatus(status: string, daysRemaining: number | null, writable: boolean): boolean {
  if (!writable) return true;
  if (status === 'PAST_DUE') return true;
  return status === 'TRIAL' && daysRemaining !== null && daysRemaining <= 3;
}

export function SubscriptionBanner() {
  const { me } = useAuth();
  const allowed = hasPermission(me, 'subscription.manage');
  const query = useSubscriptionGetHook(allowed);
  const data = query.data;

  if (!allowed || !data || !isAlertStatus(data.status, data.daysRemaining, data.writable)) {
    return null;
  }

  const statusLabel = SUBSCRIPTION_STATUS_LABELS[data.status];

  const title = data.writable
    ? data.status === 'TRIAL'
      ? `Avaliação acaba em ${data.daysRemaining} dia(s)`
      : 'Pagamento em atraso'
    : 'Clínica em somente leitura';

  return (
    <Alert>
      <AlertDescription>
        <span className="flex flex-wrap items-center justify-between gap-2">
          <span>
            {title}. Status: {statusLabel}. {data.writable ? data.contactMessage : 'Consultas e exportação continuam liberadas.'}
          </span>
          <Link href="/app/assinatura" className="text-sm font-medium underline-offset-4 hover:underline">
            Ver assinatura
          </Link>
        </span>
      </AlertDescription>
    </Alert>
  );
}
