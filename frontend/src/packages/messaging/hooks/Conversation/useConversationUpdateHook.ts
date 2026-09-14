'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { messagingQueryKeys } from '@/packages/messaging/helpers/MessagingQueryKeys';
import { ConversationUpdateService } from '@/packages/messaging/services/Conversation/ConversationUpdateService';
import type { ConversationPatchInput } from '@/packages/messaging/types/Conversation/ConversationTypes';

export function useConversationUpdateHook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      conversationId,
      conversationSchema,
    }: {
      conversationId: string;
      conversationSchema: ConversationPatchInput;
    }) => ConversationUpdateService(conversationId, conversationSchema),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['messaging-conversations'] });
      void queryClient.invalidateQueries({
        queryKey: messagingQueryKeys.conversation(data.id),
      });
      void queryClient.invalidateQueries({ queryKey: messagingQueryKeys.pendingBadge });
    },
  });
}
