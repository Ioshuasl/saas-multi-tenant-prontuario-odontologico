'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { messagingQueryKeys } from '@/packages/messaging/helpers/MessagingQueryKeys';
import { ConversationMarkReadService } from '@/packages/messaging/services/Conversation/ConversationMarkReadService';

export function useConversationMarkReadHook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => ConversationMarkReadService(conversationId),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['messaging-conversations'] });
      void queryClient.invalidateQueries({
        queryKey: messagingQueryKeys.conversation(data.id),
      });
      void queryClient.invalidateQueries({ queryKey: messagingQueryKeys.pendingBadge });
    },
  });
}
