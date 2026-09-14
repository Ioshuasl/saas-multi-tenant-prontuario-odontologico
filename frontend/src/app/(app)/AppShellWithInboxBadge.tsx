'use client';

import type { ReactNode } from 'react';
import { AppShell } from '@/packages/admin/components/Layout/AppShell';
import { useInboxPendingCountHook } from '@/packages/messaging/hooks/Inbox/useInboxPendingCountHook';

type AppShellWithInboxBadgeProps = {
  children: ReactNode;
};

/** Composition root: admin shell + badge da inbox (messaging) sem cruzar packages. */
export function AppShellWithInboxBadge({ children }: AppShellWithInboxBadgeProps) {
  const pending = useInboxPendingCountHook();
  return <AppShell inboxBadgeCount={pending.data ?? 0}>{children}</AppShell>;
}
