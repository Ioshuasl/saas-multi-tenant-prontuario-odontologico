'use client';

import { useQuery } from '@tanstack/react-query';
import { ApiClientError } from '@/shared/api/api-client';
import { hasPermission } from '@/shared/auth/permissions';
import { useAuth } from '@/shared/auth/AuthProvider';
import { messagingQueryKeys } from '@/packages/messaging/helpers/MessagingQueryKeys';
import { ConversationListService } from '@/packages/messaging/services/Conversation/ConversationListService';

const POLL_MS = 10_000;

/** Contagem para badge da nav: não lidas + PENDING (sem duplicar). */
export function useInboxPendingCountHook() {
  const { me } = useAuth();
  const canRead = hasPermission(me, 'messaging.read');

  return useQuery({
    queryKey: messagingQueryKeys.pendingBadge,
    queryFn: async () => {
      try {
        const [unread, pending] = await Promise.all([
          ConversationListService({ unread: true, limit: 100 }),
          ConversationListService({ status: 'PENDING', limit: 100 }),
        ]);
        const ids = new Set<string>();
        for (const item of unread.items) ids.add(item.id);
        for (const item of pending.items) ids.add(item.id);
        return ids.size;
      } catch (error) {
        if (error instanceof ApiClientError && (error.status === 403 || error.status === 401)) {
          return 0;
        }
        throw error;
      }
    },
    enabled: canRead,
    staleTime: 5_000,
    refetchInterval: canRead ? POLL_MS : false,
    refetchOnWindowFocus: true,
  });
}
