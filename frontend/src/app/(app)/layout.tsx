import type { ReactNode } from 'react';
import { AppShell } from '@/packages/admin/components/Layout/AppShell';
import { InboxNavBadge } from '@/packages/messaging/components/Conversation/InboxNavBadge';

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell inboxBadge={<InboxNavBadge />}>{children}</AppShell>;
}
