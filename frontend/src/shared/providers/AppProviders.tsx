'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '@/shared/auth/AuthProvider';
import { QueryProvider } from '@/shared/api/QueryProvider';
import { ThemeProvider } from '@/shared/providers/ThemeProvider';
import { Toaster } from '@/shared/ui/toast';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider>
          <Toaster>{children}</Toaster>
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
