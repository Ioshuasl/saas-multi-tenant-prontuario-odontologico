'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { messagingQueryKeys } from '@/packages/messaging/helpers/MessagingQueryKeys';
import { MessageCreateService } from '@/packages/messaging/services/Message/MessageCreateService';
import type { MessageCreateInput } from '@/packages/messaging/types/Message/MessageTypes';

export function useMessageCreateHook(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { messageCreateSchema: MessageCreateInput; idempotencyKey: string }) =>
      MessageCreateService(conversationId, input.messageCreateSchema, input.idempotencyKey),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: messagingQueryKeys.messages(conversationId),
      });
      await queryClient.invalidateQueries({ queryKey: ['messaging-conversations'] });
      await queryClient.invalidateQueries({
        queryKey: messagingQueryKeys.conversation(conversationId),
      });
    },
  });
}
