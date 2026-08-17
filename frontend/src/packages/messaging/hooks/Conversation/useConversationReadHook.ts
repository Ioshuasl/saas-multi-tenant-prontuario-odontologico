'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { messagingQueryKeys } from '@/packages/messaging/helpers/MessagingQueryKeys';
import { ConversationReadService } from '@/packages/messaging/services/Conversation/ConversationReadService';

export function useConversationReadHook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => ConversationReadService(conversationId),
    onSuccess: async (_data, conversationId) => {
      await queryClient.invalidateQueries({ queryKey: ['messaging-conversations'] });
      await queryClient.invalidateQueries({
        queryKey: messagingQueryKeys.conversation(conversationId),
      });
    },
  });
}
