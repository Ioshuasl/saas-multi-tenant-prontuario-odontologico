import {
  CalendarClockIcon,
  ChartColumnIncreasingIcon,
  FilePieChartIcon,
  ListChecksIcon,
} from 'lucide-react';
import { ClivraLogo } from '@/shared/brand/ClivraLogo';

const FEATURES = [
  { icon: CalendarClockIcon, label: 'Manage your schedule with ease' },
  { icon: ChartColumnIncreasingIcon, label: 'Real-time finance reports' },
  { icon: FilePieChartIcon, label: 'Easy to add site documents' },
  { icon: ListChecksIcon, label: 'Upcoming appointments' },
] as const;

/** Painel esquerdo da referência de login (altura total do card). */
export function AuthBrandPanel() {
  return (
    <aside className="relative flex h-full min-h-[280px] flex-col overflow-hidden bg-[#4A0F16] px-9 py-10 text-white lg:min-h-full lg:px-11 lg:py-12">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: [
            'radial-gradient(ellipse 80% 60% at 100% 0%, rgb(122 43 54 / 0.55) 0%, transparent 55%)',
            'radial-gradient(ellipse 70% 50% at 0% 100%, rgb(26 8 12 / 0.5) 0%, transparent 50%)',
          ].join(', '),
        }}
      />
      <div
        className="pointer-events-none absolute -top-32 -right-28 size-[28rem] rounded-full border border-white/[0.09]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -top-8 -right-4 size-[20rem] rounded-full border border-white/[0.06]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-[36%] -right-20 size-[24rem] rounded-full border border-white/[0.05]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-40 -left-32 size-[34rem] rounded-full border border-white/[0.07]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-[12%] left-[22%] size-[16rem] rounded-full border border-white/[0.04]"
        aria-hidden
      />

      <div className="relative z-10 shrink-0">
        <ClivraLogo size={34} wordmarkClassName="text-[1.4rem] font-semibold text-white" />
      </div>

      <ul className="relative z-10 flex flex-1 flex-col justify-center gap-8 py-10">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <li key={feature.label} className="flex items-center gap-3.5">
              <Icon className="size-[22px] shrink-0 text-white" strokeWidth={1.5} />
              <span className="text-[15px] leading-snug text-white/95">{feature.label}</span>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
