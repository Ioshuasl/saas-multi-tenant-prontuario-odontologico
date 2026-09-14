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

/** Painel de marca do login — tipografia alinhada a `prototipos/login-clivra.png`. */
export function AuthBrandPanel() {
  return (
    <aside className="relative flex h-full min-h-[320px] flex-col overflow-hidden text-white lg:min-h-dvh">
      <Image
        src={CLIVRA.loginClinicBg}
        alt=""
        fill
        priority
        sizes="(max-width: 1024px) 100vw, 45vw"
        className="object-cover object-center"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgb(74 15 22 / 0.72) 0%, rgb(74 15 22 / 0.84) 42%, rgb(42 10 16 / 0.94) 100%)',
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

      <div className="relative z-10 flex h-full min-h-dvh flex-1 flex-col px-10 py-9 lg:px-12 lg:py-10">
        <ClivraLogo
          size={34}
          className="shrink-0"
          wordmarkClassName="login-sans text-[22px] font-semibold tracking-[-0.02em] text-white"
        />

        <div className="mt-16 flex flex-1 flex-col lg:mt-[4.5rem]">
          <div className="max-w-[32rem]">
            <h2 className="login-display text-[42px] leading-[1.18] font-semibold tracking-[-0.015em] text-white">
              Tecnologia e cuidado para uma odontologia mais eficiente.
            </h2>
            <p className="login-sans mt-4 text-[17px] leading-[1.55] font-normal text-white/88">
              Gestão completa para clínicas odontológicas, em um só lugar.
            </p>
          </div>

          <ul className="mt-12 grid gap-7">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <li key={feature.title} className="flex items-start gap-3.5">
                  <Icon
                    className="mt-0.5 size-[22px] shrink-0 text-[#F0C4CA]"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="login-sans text-[16px] leading-snug font-semibold text-white">
                      {feature.title}
                    </p>
                    <p className="login-sans mt-1 text-[14px] leading-snug font-normal text-white/72">
                      {feature.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-auto pt-12">
            <div className="mb-4 h-px w-full bg-white/25" aria-hidden />
            <p className="login-sans text-[11px] font-medium tracking-[0.16em] text-white/78 uppercase">
              Clínicas mais organizadas. Sorrisos mais saudáveis.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
