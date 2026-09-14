'use client';

import Link from 'next/link';
import {
  CalendarPlusIcon,
  CirclePlusIcon,
  CreditCardIcon,
  UserPlusIcon,
  ZapIcon,
} from 'lucide-react';
import { cn } from '@/shared/helpers/utils';

const ACTIONS = [
  {
    href: '/app/pacientes',
    label: 'Novo paciente',
    icon: UserPlusIcon,
  },
  {
    href: '/app/agenda',
    label: 'Agendar consulta',
    icon: CalendarPlusIcon,
  },
  {
    href: '/app/agenda',
    label: 'Novo atendimento',
    icon: CirclePlusIcon,
  },
  {
    href: '/app/financeiro',
    label: 'Lançar despesa',
    icon: CreditCardIcon,
  },
] as const;

export function DashboardQuickActions() {
  return (
    <section
      className="rounded-2xl border border-[#EBE4DE] bg-white p-3.5 shadow-[0_1px_2px_rgb(74_15_22/0.04)]"
      data-testid="dashboard-quick-actions"
    >
      <header className="mb-3 flex items-center gap-1.5">
        <ZapIcon className="size-3.5 text-[#4A0F16]" strokeWidth={1.7} />
        <h2 className="font-sans text-[15px] font-semibold text-[#1A1A1A]">Ações rápidas</h2>
      </header>
      <div className="grid grid-cols-2 gap-2.5">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              prefetch={false}
              className={cn(
                'flex min-h-[3.25rem] items-center gap-2.5 rounded-xl border border-[#EBE4DE]',
                'bg-white px-3 py-2.5 transition-colors hover:border-[#4A0F16]/25 hover:bg-[#FCFAF8]',
              )}
            >
              <Icon className="size-4 shrink-0 text-[#4A0F16]" strokeWidth={1.45} />
              <span className="min-w-0 text-left font-sans text-[13px] font-medium leading-tight text-[#3A3330]">
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
