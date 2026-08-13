import type { ReactNode } from 'react';
import { AppShell } from '@/packages/admin/components/Layout/AppShell';

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
