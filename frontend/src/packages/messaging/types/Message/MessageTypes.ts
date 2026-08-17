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

export type MessageListQuery = {
  cursor?: string;
  limit?: number;
};

export type MessageListResult = {
  items: InboxMessage[];
  nextCursor: string | null;
};

export type MessageCreateInput = {
  text?: string;
  mediaStorageKey?: string;
};
