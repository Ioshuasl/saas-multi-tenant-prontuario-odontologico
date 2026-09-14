'use client';

import { useQuery } from '@tanstack/react-query';
import { messagingQueryKeys } from '@/packages/messaging/helpers/MessagingQueryKeys';
import { ConversationListService } from '@/packages/messaging/services/Conversation/ConversationListService';
import type { ConversationListQuery } from '@/packages/messaging/types/Conversation/ConversationTypes';

const POLL_MS = 8_000;

export function useConversationListHook(query: ConversationListQuery = {}) {
  return useQuery({
    queryKey: messagingQueryKeys.conversations(query as Record<string, unknown>),
    queryFn: () => ConversationListService(query),
    staleTime: 5_000,
    refetchInterval: POLL_MS,
    refetchOnWindowFocus: true,
  });
}
