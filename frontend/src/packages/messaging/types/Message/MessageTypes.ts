export type InboxMessage = {
  id: string;
  conversationId: string;
  direction: string;
  type: string;
  body: string | null;
  mediaKey: string | null;
  status: string;
  sentBy: string | null;
  createdAt: string;
};

export type InboxMessageListQuery = {
  cursor?: string;
  limit?: number;
};

export type InboxMessageListResult = {
  items: InboxMessage[];
  nextCursor: string | null;
};

export type MessageSendInput = {
  text?: string;
  mediaStorageKey?: string;
};
