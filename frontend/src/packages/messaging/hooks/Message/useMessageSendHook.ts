'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { messagingQueryKeys } from '@/packages/messaging/helpers/MessagingQueryKeys';
import { MessageSendService } from '@/packages/messaging/services/Message/MessageSendService';
import type { MessageSendInput } from '@/packages/messaging/types/Message/MessageTypes';

export function useMessageSendHook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      conversationId,
      messageSchema,
      idempotencyKey,
    }: {
      conversationId: string;
      messageSchema: MessageSendInput;
      idempotencyKey: string;
    }) => MessageSendService(conversationId, messageSchema, idempotencyKey),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: messagingQueryKeys.messages(data.conversationId),
      });
      void queryClient.invalidateQueries({ queryKey: ['messaging-conversations'] });
      void queryClient.invalidateQueries({
        queryKey: messagingQueryKeys.conversation(data.conversationId),
      });
    },
  });
}
