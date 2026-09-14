import type { ReactNode } from 'react';
import { cn } from '@/shared/helpers/utils';

type ClivraPageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

/** Page header Clivra — espelha o padrão de Pacientes (título + descrição + 1 CTA). */
export function ClivraPageHeader({
  title,
  description,
  action,
  className,
}: ClivraPageHeaderProps) {
  return (
    <header className={cn('flex flex-wrap items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="flex flex-wrap items-center gap-2">{action}</div> : null}
    </header>
  );
}

type ClivraSurfaceProps = {
  children: ReactNode;
  toolbar?: ReactNode;
  className?: string;
  contentClassName?: string;
};

/** Card de conteúdo Clivra — mesmo shell visual da listagem de Pacientes. */
export function ClivraSurface({
  children,
  toolbar,
  className,
  contentClassName,
}: ClivraSurfaceProps) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgb(74_15_22/0.04)]',
        className,
      )}
    >
      {toolbar ? (
        <div className="border-b border-border/80 px-4 py-3">{toolbar}</div>
      ) : null}
      <div className={cn(contentClassName)}>{children}</div>
    </section>
  );
}
