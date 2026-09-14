'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '@/shared/auth/AuthProvider';
import { QueryProvider } from '@/shared/api/QueryProvider';
import { ThemeProvider } from '@/shared/providers/ThemeProvider';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider>{children}</AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
