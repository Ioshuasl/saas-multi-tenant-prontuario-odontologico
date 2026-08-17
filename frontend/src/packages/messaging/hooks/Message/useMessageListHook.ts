'use client';

import { useQuery } from '@tanstack/react-query';
import { messagingQueryKeys } from '@/packages/messaging/helpers/MessagingQueryKeys';
import { MessageListService } from '@/packages/messaging/services/Message/MessageListService';

const POLL_MS = 8_000;

export function useMessageListHook(conversationId: string | null) {
  return useQuery({
    queryKey: messagingQueryKeys.messages(conversationId ?? ''),
    queryFn: () => MessageListService(conversationId!, { limit: 50 }),
    enabled: Boolean(conversationId),
    refetchInterval: POLL_MS,
  });
}
