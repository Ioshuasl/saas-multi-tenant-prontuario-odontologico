'use client';

import type { ReactNode } from 'react';
import { AppShell } from '@/packages/admin/components/Layout/AppShell';
import { TooltipProvider } from '@/shared/ui/tooltip';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <AppShell>{children}</AppShell>
    </TooltipProvider>
  );
}
