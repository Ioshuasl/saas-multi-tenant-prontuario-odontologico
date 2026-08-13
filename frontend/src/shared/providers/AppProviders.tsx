'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '@/shared/auth/AuthProvider';
import { QueryProvider } from '@/shared/api/QueryProvider';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>{children}</AuthProvider>
    </QueryProvider>
  );
}
