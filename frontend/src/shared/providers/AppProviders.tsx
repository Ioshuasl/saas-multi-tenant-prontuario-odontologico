'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '@/shared/auth/AuthProvider';
import { QueryProvider } from '@/shared/api/QueryProvider';
import { MotionProvider } from '@/shared/motion/MotionProvider';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <MotionProvider>
        <AuthProvider>{children}</AuthProvider>
      </MotionProvider>
    </QueryProvider>
  );
}
