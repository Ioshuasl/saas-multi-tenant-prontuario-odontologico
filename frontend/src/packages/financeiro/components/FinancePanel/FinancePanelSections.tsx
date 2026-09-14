'use client';

import {
  addDaysIso,
  formatIsoDayMonth,
  remainingCents,
} from '@/packages/financeiro/helpers/FinanceiroDate';
import { formatCents } from '@/packages/financeiro/helpers/FormatCents';
import { INSTALLMENT_PAYABLE_STATUSES } from '@/packages/financeiro/enum/Installment/InstallmentStatusEnum';
import type {
  FinanceAttentionItem,
  FinanceMovementFilter,
  FinanceMovementItem,
} from '@/packages/financeiro/types/FinancePanel/FinancePanelTypes';
import type { Installment } from '@/packages/financeiro/types/Installment/InstallmentTypes';
import type { Payable } from '@/packages/financeiro/types/Payable/PayableTypes';
import { cn } from '@/shared/helpers/utils';
import { Button } from '@/shared/ui/button';
import { Can } from '@/shared/auth/Can';

type FinancePanelMetricsProps = {
  dueTodayCents: number;
  dueTodayCount: number;
  overdueCents: number;
  overdueCount: number;
  payables7dCents: number;
  payables7dCount: number;
};

export function FinancePanelMetrics({
  dueTodayCents,
  dueTodayCount,
  overdueCents,
  overdueCount,
  payables7dCents,
  payables7dCount,
}: FinancePanelMetricsProps) {
  const cards = [
    {
      eyebrow: 'A entrar hoje',
      value: formatCents(dueTodayCents),
      sub: `${dueTodayCount} título${dueTodayCount === 1 ? '' : 's'}`,
      accent: 'border-l-info',
      subClass: 'text-info',
    },
    {
      eyebrow: 'Atrasado',
      value: formatCents(overdueCents),
      sub: `${overdueCount} cobrança${overdueCount === 1 ? '' : 's'} · prioridade`,
      accent: 'border-l-destructive',
      subClass: 'text-destructive',
    },
    {
      eyebrow: 'A pagar (7 dias)',
      value: formatCents(payables7dCents),
      sub: `${payables7dCount} conta${payables7dCount === 1 ? '' : 's'}`,
      accent: 'border-l-warning',
      subClass: 'text-warning',
    },
  ] as const;

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {cards.map((card) => (
        <article
          key={card.eyebrow}
          className={cn(
            'rounded-2xl border border-border bg-card py-4 pl-4 pr-4 border-l-4',
            card.accent,
          )}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {card.eyebrow}
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{card.value}</p>
          <p className={cn('mt-2 text-xs font-medium', card.subClass)}>{card.sub}</p>
        </article>
      ))}
    </div>
  );
}

type FinancePanelAttentionProps = {
  items: FinanceAttentionItem[];
  onReceber: (installment: Installment) => void;
  onPagar: (payable: Payable) => void;
};

export function FinancePanelAttention({ items, onReceber, onPagar }: FinancePanelAttentionProps) {
  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <header className="border-b border-border/80 px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-foreground">Precisa de atenção</h2>
          <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-destructive">
            {items.length}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Cobranças e contas que pedem ação agora — sem procurar.
        </p>
      </header>
      <ul className="divide-y divide-border">
        {items.length === 0 ? (
          <li className="px-4 py-8 text-sm text-muted-foreground">Nada urgente no momento.</li>
        ) : (
          items.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'text-[10px] font-semibold uppercase tracking-wide',
                    item.urgency === 'danger' && 'text-destructive',
                    item.urgency === 'warning' && 'text-warning',
                    item.urgency === 'info' && 'text-info',
                  )}
                >
                  {item.kind === 'entrada' ? 'Receber' : 'Pagar'}
                </p>
                <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {item.whenLabel} · {item.detail}
                </p>
              </div>
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {formatCents(item.amountCents)}
              </p>
              <Can permission="finance.write">
                {item.kind === 'entrada' && item.installment ? (
                  <Button
                    type="button"
                    size="sm"
                    className="cursor-pointer"
                    onClick={() => onReceber(item.installment!)}
                  >
                    Receber
                  </Button>
                ) : null}
                {item.kind === 'saida' && item.payable ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => onPagar(item.payable!)}
                  >
                    Pagar
                  </Button>
                ) : null}
              </Can>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

type FinancePanelMovementsProps = {
  items: FinanceMovementItem[];
  filter: FinanceMovementFilter;
  onFilterChange: (filter: FinanceMovementFilter) => void;
  onReceber: (installment: Installment) => void;
  onPagar: (payable: Payable) => void;
};

export function FinancePanelMovements({
  items,
  filter,
  onFilterChange,
  onReceber,
  onPagar,
}: FinancePanelMovementsProps) {
  const chips: Array<{ id: FinanceMovementFilter; label: string }> = [
    { id: 'todas', label: 'Todas' },
    { id: 'entradas', label: 'Entradas' },
    { id: 'saidas', label: 'Saídas' },
  ];

  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <header className="border-b border-border/80 px-4 py-3">
        <h2 className="text-base font-semibold text-foreground">Movimentações</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Entradas e saídas juntas — um só lugar.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <Button
              key={chip.id}
              type="button"
              size="sm"
              variant={filter === chip.id ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => onFilterChange(chip.id)}
            >
              {chip.label}
            </Button>
          ))}
        </div>
      </header>
      <ul className="divide-y divide-border">
        {items.length === 0 ? (
          <li className="px-4 py-8 text-sm text-muted-foreground">Nenhuma movimentação em aberto.</li>
        ) : (
          items.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span
                className={cn(
                  'rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase',
                  item.kind === 'entrada' ? 'text-success' : 'text-destructive',
                )}
              >
                {item.kind === 'entrada' ? 'Entrada' : 'Saída'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {item.detail} · vence {formatIsoDayMonth(item.dueDate)}
                </p>
              </div>
              <p
                className={cn(
                  'text-sm font-semibold tabular-nums',
                  item.kind === 'entrada' ? 'text-success' : 'text-destructive',
                )}
              >
                {item.kind === 'entrada' ? '+' : '−'} {formatCents(item.amountCents)}
              </p>
              <Can permission="finance.write">
                {item.kind === 'entrada' && item.installment ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="cursor-pointer"
                    onClick={() => onReceber(item.installment!)}
                  >
                    Receber
                  </Button>
                ) : null}
                {item.kind === 'saida' && item.payable ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="cursor-pointer"
                    onClick={() => onPagar(item.payable!)}
                  >
                    Pagar
                  </Button>
                ) : null}
              </Can>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

export function buildFinanceAttentionItems(args: {
  dueToday: Installment[];
  overdue: Installment[];
  payables: Payable[];
  patientNames: Record<string, string>;
  today: string;
}): FinanceAttentionItem[] {
  const { dueToday, overdue, payables, patientNames, today } = args;
  const in3 = addDaysIso(today, 3);
  const items: FinanceAttentionItem[] = [];

  for (const installment of overdue) {
    items.push({
      id: `i-${installment.id}`,
      kind: 'entrada',
      title: patientNames[installment.patientId] ?? 'Paciente',
      detail: `Parcela ${installment.number}`,
      whenLabel: 'Em atraso',
      amountCents: remainingCents(installment.amountCents, installment.paidCents),
      urgency: 'danger',
      installment,
    });
  }

  for (const installment of dueToday) {
    if (installment.status === 'OVERDUE') continue;
    items.push({
      id: `i-${installment.id}`,
      kind: 'entrada',
      title: patientNames[installment.patientId] ?? 'Paciente',
      detail: `Parcela ${installment.number}`,
      whenLabel: 'Vence hoje',
      amountCents: remainingCents(installment.amountCents, installment.paidCents),
      urgency: 'info',
      installment,
    });
  }

  for (const payable of payables) {
    if (payable.dueDate > in3) continue;
    items.push({
      id: `p-${payable.id}`,
      kind: 'saida',
      title: payable.supplier || payable.description,
      detail: payable.description,
      whenLabel: payable.dueDate < today ? 'Vencida' : payable.dueDate === today ? 'Vence hoje' : 'Em breve',
      amountCents: payable.amountCents,
      urgency: payable.dueDate <= today ? 'warning' : 'warning',
      payable,
    });
  }

  return items.slice(0, 8);
}

export function buildFinanceMovementItems(args: {
  installments: Installment[];
  payables: Payable[];
  patientNames: Record<string, string>;
  filter: FinanceMovementFilter;
}): FinanceMovementItem[] {
  const { installments, payables, patientNames, filter } = args;
  const entradas: FinanceMovementItem[] = installments
    .filter((item) => INSTALLMENT_PAYABLE_STATUSES.includes(item.status))
    .map((installment) => ({
      id: `i-${installment.id}`,
      kind: 'entrada' as const,
      title: patientNames[installment.patientId] ?? 'Paciente',
      detail: `Parcela ${installment.number}`,
      dueDate: installment.dueDate,
      amountCents: remainingCents(installment.amountCents, installment.paidCents),
      installment,
    }));

  const saidas: FinanceMovementItem[] = payables.map((payable) => ({
    id: `p-${payable.id}`,
    kind: 'saida' as const,
    title: payable.supplier || payable.description,
    detail: payable.description,
    dueDate: payable.dueDate,
    amountCents: payable.amountCents,
    payable,
  }));

  const merged = [...entradas, ...saidas].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  if (filter === 'entradas') return merged.filter((item) => item.kind === 'entrada');
  if (filter === 'saidas') return merged.filter((item) => item.kind === 'saida');
  return merged;
}
