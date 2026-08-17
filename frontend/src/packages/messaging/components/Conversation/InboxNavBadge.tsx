'use client';

import { useConversationListHook } from '@/packages/messaging/hooks/Conversation/useConversationListHook';
import { useAuth } from '@/shared/auth/AuthProvider';
import { hasPermission } from '@/shared/auth/permissions';
import { SidebarMenuBadge } from '@/shared/ui/sidebar-menu';

export function InboxNavBadge() {
  const { me } = useAuth();
  const allowed = hasPermission(me, 'messaging.read');
  const listQuery = useConversationListHook({ limit: 50 }, { enabled: allowed });
  const count = (listQuery.data?.items ?? []).filter(
    (item) => item.unreadCount > 0 || item.status === 'PENDING',
  ).length;

  if (!allowed || count < 1) return null;

  return (
    <SidebarMenuBadge aria-label={`${count} conversas pendentes ou não lidas`}>
      {count}
    </SidebarMenuBadge>
  );
}
