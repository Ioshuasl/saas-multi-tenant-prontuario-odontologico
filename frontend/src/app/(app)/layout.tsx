import type { ReactNode } from 'react';
import { AppShellWithInboxBadge } from '@/app/(app)/AppShellWithInboxBadge';

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShellWithInboxBadge>{children}</AppShellWithInboxBadge>;
}
