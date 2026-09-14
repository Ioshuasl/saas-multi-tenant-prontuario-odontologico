'use client';

import Link from 'next/link';
import type { ComponentType, ReactNode } from 'react';
import { ChevronRightIcon } from 'lucide-react';
import { cn } from '@/shared/helpers/utils';

export type DashboardMetric = {
  id: string;
  title: string;
  value: string;
  valueHint?: string;
  href: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  footer: ReactNode;
};

type DashboardMetricCardsProps = {
  metrics: DashboardMetric[];
};

export function DashboardMetricCards({ metrics }: DashboardMetricCardsProps) {
  return (
    <section
      className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-5"
      data-testid="dashboard-kpi-grid"
    >
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Link
            key={metric.id}
            href={metric.href}
            prefetch={false}
            className={cn(
              'group flex min-h-[6.25rem] min-w-0 flex-col justify-between gap-2.5 rounded-2xl border border-[#EBE4DE] bg-white p-3.5',
              'shadow-[0_1px_2px_rgb(74_15_22/0.04)] transition-shadow hover:shadow-md',
            )}
          >
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#F3EEE9] text-[#4A0F16]">
                  <Icon className="size-4" strokeWidth={1.55} />
                </span>
                <p className="truncate font-sans text-[13px] font-medium text-[#6F6762]">{metric.title}</p>
              </div>
              <ChevronRightIcon
                className="size-3.5 shrink-0 text-[#C9C0B9] transition-colors group-hover:text-[#4A0F16]"
                strokeWidth={1.8}
              />
            </div>

            <div className="grid min-w-0 gap-1.5">
              <p className="truncate font-sans text-[22px] leading-none font-semibold tracking-tight text-[#1A1A1A] tabular-nums">
                {metric.valueHint ? (
                  <>
                    {metric.value}
                    <span className="ml-1 text-[13px] font-medium text-[#8A7F79]">
                      {metric.valueHint}
                    </span>
                  </>
                ) : (
                  metric.value
                )}
              </p>
              <div className="font-sans text-[12px] text-[#7A716C]">{metric.footer}</div>
            </div>
          </Link>
        );
      })}
    </section>
  );
}

export function MetricDotFooter({
  color,
  children,
}: {
  color: 'green' | 'rose' | 'primary' | 'muted';
  children: ReactNode;
}) {
  const dot =
    color === 'green'
      ? 'bg-[#2F9E5B]'
      : color === 'rose'
        ? 'bg-[#C14C4A]'
        : color === 'primary'
          ? 'bg-[#4A0F16]'
          : 'bg-[#C4BBB4]';

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('size-1.5 shrink-0 rounded-full', dot)} aria-hidden />
      <span>{children}</span>
    </span>
  );
}
