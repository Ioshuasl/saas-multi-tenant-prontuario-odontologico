'use client';

import { useQuery } from '@tanstack/react-query';
import { messagingQueryKeys } from '@/packages/messaging/helpers/MessagingQueryKeys';
import { ConversationGetService } from '@/packages/messaging/services/Conversation/ConversationGetService';

export function useConversationGetHook(conversationId: string | null) {
  return useQuery({
    queryKey: messagingQueryKeys.conversation(conversationId ?? ''),
    queryFn: () => ConversationGetService(conversationId!),
    enabled: Boolean(conversationId),
  });
}
