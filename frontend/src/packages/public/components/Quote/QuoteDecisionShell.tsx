'use client';

import type { ReactNode } from 'react';

type QuoteDecisionShellProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function QuoteDecisionShell({ title, description, children }: QuoteDecisionShellProps) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 py-6">
      <header className="mb-6">
        <p className="text-sm text-muted-foreground">Proposta comercial</p>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </header>
      <div className="flex flex-1 flex-col gap-4">{children}</div>
    </main>
  );
}
