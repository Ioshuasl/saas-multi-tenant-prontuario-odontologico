'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { messagingQueryKeys } from '@/packages/messaging/helpers/MessagingQueryKeys';
import { ConversationUpdateService } from '@/packages/messaging/services/Conversation/ConversationUpdateService';
import type { ConversationUpdateInput } from '@/packages/messaging/types/Conversation/ConversationTypes';

export function useConversationUpdateHook(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationUpdateSchema: ConversationUpdateInput) =>
      ConversationUpdateService(conversationId, conversationUpdateSchema),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['messaging-conversations'] });
      await queryClient.invalidateQueries({
        queryKey: messagingQueryKeys.conversation(conversationId),
      });
    },
  });
}
