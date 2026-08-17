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

export type MessageListResult = {
  items: InboxMessage[];
  nextCursor: string | null;
};
