'use client';

import { useQuery } from '@tanstack/react-query';
import { messagingQueryKeys } from '@/packages/messaging/helpers/MessagingQueryKeys';
import { ConversationListService } from '@/packages/messaging/services/Conversation/ConversationListService';
import type { ConversationListQuery } from '@/packages/messaging/types/Conversation/ConversationTypes';

const POLL_MS = 8_000;

export function useConversationListHook(
  query: ConversationListQuery = {},
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: messagingQueryKeys.conversations(query),
    queryFn: () => ConversationListService(query),
    refetchInterval: POLL_MS,
    enabled: options?.enabled ?? true,
  });
}
