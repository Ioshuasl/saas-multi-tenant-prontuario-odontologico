'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ClipboardListIcon, XIcon } from 'lucide-react';
import { cn } from '@/shared/helpers/utils';

type DashboardHeroProps = {
  greetingLabel: string;
  firstName: string;
  showProfileCard?: boolean;
  profileHref?: string;
};

export function DashboardHero({
  greetingLabel,
  firstName,
  showProfileCard = true,
  profileHref = '/app/configuracoes/clinica',
}: DashboardHeroProps) {
  const [profileDismissed, setProfileDismissed] = useState(false);
  const showCard = showProfileCard && !profileDismissed;

  return (
    <section
      className={cn(
        'grid gap-3 lg:items-center lg:gap-4',
        showCard ? 'lg:grid-cols-[minmax(0,1fr)_minmax(15rem,18rem)]' : null,
      )}
    >
      <div className="flex min-w-0 flex-col justify-center gap-1">
        <p className="text-[10px] font-semibold tracking-[0.14em] text-[#9A908A] uppercase">
          {greetingLabel}, {firstName}
        </p>
        <h1 className="font-display max-w-[28ch] text-[1.35rem] leading-[1.2] font-bold text-[#4A0F16] lg:text-[1.5rem]">
          Tudo certo para um excelente dia de atendimentos!
        </h1>
        <p className="max-w-md text-[12px] leading-snug text-[#7A716C]">
          Aqui você acompanha o que realmente importa na sua clínica.
        </p>
      </div>

      {showCard ? (
        <aside
          className={cn(
            'relative w-full max-w-[18rem] justify-self-end overflow-hidden rounded-xl border border-[#E8E0DA] bg-[#F3EEE9]',
            'flex items-center gap-2.5 px-3 py-2.5',
          )}
        >
          <button
            type="button"
            onClick={() => setProfileDismissed(true)}
            className="absolute top-1.5 right-1.5 z-20 inline-flex size-5 items-center justify-center rounded text-[#B0A8A2] transition-colors hover:bg-white/70 hover:text-[#4A0F16]"
            aria-label="Fechar"
          >
            <XIcon className="size-3" strokeWidth={1.8} />
          </button>

          <span className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#4A0F16] text-white">
            <ClipboardListIcon className="size-3.5" strokeWidth={1.55} />
          </span>

          <div className="relative z-10 min-w-0 flex-1 pr-3">
            <p className="text-[12px] font-semibold leading-tight text-[#3A1018]">
              Complete seu perfil
            </p>
            <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-[#7A716C]">
              Mantenha suas informações atualizadas no Clivra.
            </p>
            <Link
              href={profileHref}
              prefetch={false}
              className="mt-1.5 inline-flex h-6 items-center rounded-md bg-[#4A0F16] px-2.5 text-[10px] font-medium text-white transition-colors hover:bg-[#3A0C12]"
            >
              Ver perfil
            </Link>
          </div>

          <div className="pointer-events-none absolute inset-y-0 right-0 w-[38%]" aria-hidden>
            <div className="absolute -right-6 -bottom-8 size-24 rounded-full border-[10px] border-[#4A0F16]/18" />
            <div className="absolute -right-1 -top-5 size-14 rounded-full border-[8px] border-[#4A0F16]/12" />
          </div>
        </aside>
      ) : null}
    </section>
  );
}
