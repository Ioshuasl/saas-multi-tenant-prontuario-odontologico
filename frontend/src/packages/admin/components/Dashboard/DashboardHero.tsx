'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ClipboardListIcon, XIcon } from 'lucide-react';
import { CLIVRA } from '@/shared/brand/ClivraBrand';
import { cn } from '@/shared/helpers/utils';

type DashboardHeroProps = {
  greetingLabel: string;
  firstName: string;
  showProfileCard?: boolean;
  profileHref?: string;
};

/** Page header do dashboard — tipografia e card alinhados a `prototipos/dashboard-clivra.png`. */
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
        'grid gap-4 lg:items-center lg:gap-6',
        showCard ? 'lg:grid-cols-[minmax(0,1fr)_minmax(26rem,32rem)]' : null,
      )}
    >
      <div className="flex min-w-0 flex-col gap-1.5">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          {greetingLabel}, {firstName}
        </p>
        <h1 className="max-w-[22ch] text-[28px] leading-[1.2] font-semibold tracking-tight text-foreground lg:text-[30px]">
          Tudo certo para um
          <br />
          excelente dia de atendimentos!
        </h1>
        <p className="max-w-md text-[14px] leading-snug text-muted-foreground">
          Aqui você acompanha o que realmente importa na sua clínica.
        </p>
      </div>

      {showCard ? (
        <aside
          className={cn(
            'relative w-full max-w-[32rem] justify-self-start overflow-hidden rounded-[14px]',
            'border border-border bg-card',
            'flex items-start gap-3 px-4 py-3.5 pr-24 lg:justify-self-end',
          )}
        >
          <button
            type="button"
            onClick={() => setProfileDismissed(true)}
            className="absolute top-2.5 right-2.5 z-20 inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Fechar"
          >
            <XIcon className="size-3.5" strokeWidth={1.8} />
          </button>

          <span className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <ClipboardListIcon className="size-4" strokeWidth={1.55} />
          </span>

          <div className="relative z-10 min-w-0 flex-1">
            <p className="text-[14px] font-semibold leading-tight text-foreground">
              Complete seu perfil
            </p>
            <p className="mt-1 max-w-[18rem] text-[12px] leading-snug text-muted-foreground">
              Mantenha suas informações sempre atualizadas para uma melhor experiência no Clivra.
            </p>
            <Link
              href={profileHref}
              prefetch={false}
              className="mt-3 inline-flex h-8 items-center rounded-md bg-primary px-3 text-[12px] font-medium text-primary-foreground transition-colors hover:bg-secondary"
            >
              Ver perfil
            </Link>
          </div>

          <div
            className="pointer-events-none absolute inset-y-0 -right-4 z-0 flex w-[13rem] items-center justify-end overflow-hidden"
            aria-hidden
          >
            <Image
              src={CLIVRA.logoIcon}
              alt=""
              width={280}
              height={280}
              className="size-[16rem] translate-x-6 translate-y-3 scale-125 opacity-45"
            />
          </div>
        </aside>
      ) : null}
    </section>
  );
}
