import Image from 'next/image';
import {
  CalendarDaysIcon,
  ChartColumnIncreasingIcon,
  UserRoundIcon,
} from 'lucide-react';
import { ClivraLogo } from '@/shared/brand/ClivraLogo';
import { CLIVRA } from '@/shared/brand/ClivraBrand';

const FEATURES = [
  {
    icon: CalendarDaysIcon,
    title: 'Agenda inteligente',
    description: 'Organize seus atendimentos com facilidade',
  },
  {
    icon: UserRoundIcon,
    title: 'Pacientes sempre no centro',
    description: 'Histórico completo e acesso rápido',
  },
  {
    icon: ChartColumnIncreasingIcon,
    title: 'Controle financeiro',
    description: 'Mais previsibilidade para o seu negócio',
  },
] as const;

/** Painel de marca do login — densifica em notebooks (altura ~768px). */
export function AuthBrandPanel() {
  return (
    <aside className="relative flex h-full min-h-0 flex-col overflow-hidden text-white">
      <Image
        src={CLIVRA.loginClinicBg}
        alt=""
        fill
        priority
        sizes="(max-width: 1024px) 100vw, 55vw"
        className="object-cover object-center"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, rgba(74, 15, 22, 0.88), rgba(74, 15, 22, 0.62))',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-16 size-[22rem] rounded-full opacity-50 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgb(168 91 103 / 0.55) 0%, transparent 70%)' }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-[8%] left-[18%] size-[14rem] rounded-full opacity-40 blur-2xl"
        style={{ background: 'radial-gradient(circle, rgb(122 43 54 / 0.7) 0%, transparent 70%)' }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-[18%] -right-20 size-[18rem] rounded-full opacity-30 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgb(168 91 103 / 0.45) 0%, transparent 70%)' }}
        aria-hidden
      />

      <div
        className={[
          'relative z-10 flex h-full min-h-0 flex-1 flex-col',
          'px-8 py-7 lg:px-10 lg:py-8',
          '[@media(max-height:820px)]:px-7 [@media(max-height:820px)]:py-5',
          '[@media(max-height:720px)]:py-4',
        ].join(' ')}
      >
        <ClivraLogo
          size={32}
          className="shrink-0 [@media(max-height:820px)]:scale-95"
          wordmarkClassName="login-display text-[20px] font-semibold text-white lg:text-[22px]"
        />

        <div
          className={[
            'mt-10 flex min-h-0 flex-1 flex-col lg:mt-12',
            '[@media(max-height:900px)]:mt-8',
            '[@media(max-height:820px)]:mt-5',
            '[@media(max-height:720px)]:mt-4',
          ].join(' ')}
        >
          <div className="w-full max-w-[34rem] shrink-0">
            <h2
              className={[
                'login-display font-semibold text-white',
                'text-[clamp(1.625rem,2.6vw+0.6rem,2.625rem)] leading-[1.2]',
                '[@media(max-height:820px)]:text-[1.75rem] [@media(max-height:820px)]:leading-[1.22]',
                '[@media(max-height:720px)]:text-[1.5rem]',
              ].join(' ')}
            >
              <span className="block">Tecnologia e cuidado</span>
              <span className="block">para uma odontologia</span>
              <span className="block">mais eficiente.</span>
            </h2>
            <p
              className={[
                'login-sans mt-3 max-w-[28rem] font-normal text-white/88',
                'text-[15px] leading-[1.5] lg:text-[16px] lg:leading-[1.55]',
                '[@media(max-height:820px)]:mt-2 [@media(max-height:820px)]:text-[14px]',
                '[@media(max-height:720px)]:mt-1.5 [@media(max-height:720px)]:text-[13px]',
              ].join(' ')}
            >
              Gestão completa para clínicas odontológicas, em um só lugar.
            </p>
          </div>

          <ul
            className={[
              'mt-8 grid gap-5 lg:mt-10 lg:gap-6',
              '[@media(max-height:900px)]:mt-6 [@media(max-height:900px)]:gap-4',
              '[@media(max-height:820px)]:mt-4 [@media(max-height:820px)]:gap-3',
              '[@media(max-height:720px)]:mt-3 [@media(max-height:720px)]:gap-2.5',
            ].join(' ')}
          >
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <li key={feature.title} className="flex items-start gap-3">
                  <Icon
                    className="mt-0.5 size-5 shrink-0 text-[#F0C4CA] [@media(max-height:820px)]:size-[18px]"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="login-sans text-[15px] leading-snug font-semibold text-white [@media(max-height:820px)]:text-[14px]">
                      {feature.title}
                    </p>
                    <p className="login-sans mt-0.5 text-[13px] leading-snug font-normal text-white/72 [@media(max-height:820px)]:text-[12px]">
                      {feature.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          <div
            className={[
              'mt-auto shrink-0 pt-8',
              '[@media(max-height:820px)]:pt-4',
              '[@media(max-height:700px)]:hidden',
            ].join(' ')}
          >
            <div className="mb-3 h-px w-full bg-white/25" aria-hidden />
            <p className="login-sans text-[11px] font-medium tracking-[0.14em] text-white/78 uppercase">
              Clínicas mais organizadas. Sorrisos mais saudáveis.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
