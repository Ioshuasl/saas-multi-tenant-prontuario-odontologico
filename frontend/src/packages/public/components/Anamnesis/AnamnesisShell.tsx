'use client';

import type { ReactNode } from 'react';
import { ThemeToggle } from '@/shared/ui/theme-toggle';

type AnamnesisShellProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function AnamnesisShell({ title, description, children }: AnamnesisShellProps) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 py-6">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">Anamnese</p>
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
        <ThemeToggle />
      </header>
      <div className="flex flex-1 flex-col gap-4">{children}</div>
    </main>
  );
}
