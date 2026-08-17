import type { ConversationListQuery } from '@/packages/messaging/types/Conversation/ConversationTypes';

export const messagingQueryKeys = {
  account: ['messaging-account'] as const,
  qr: ['messaging-account-qr'] as const,
  usage: ['messaging-usage'] as const,
  logs: (result?: string) => ['messaging-logs', result ?? ''] as const,
  conversations: (query: ConversationListQuery = {}) =>
    ['messaging-conversations', query] as const,
  conversation: (id: string) => ['messaging-conversation', id] as const,
  messages: (conversationId: string) => ['messaging-messages', conversationId] as const,
};
