'use client';

import type { ReactNode } from 'react';
import { Progress } from '@/shared/ui/progress';

type BookingShellProps = {
  title: string;
  description?: string;
  stepLabel?: string;
  progress?: number;
  children: ReactNode;
};

export function BookingShell({ title, description, stepLabel, progress, children }: BookingShellProps) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 py-6">
      <header className="mb-6">
        <p className="text-sm text-muted-foreground">Agendar consulta</p>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        {stepLabel ? <p className="mt-3 text-sm font-medium">{stepLabel}</p> : null}
        {progress != null ? <Progress value={progress} className="mt-2" /> : null}
      </header>
      <div className="flex flex-1 flex-col gap-4">{children}</div>
    </main>
  );
}
