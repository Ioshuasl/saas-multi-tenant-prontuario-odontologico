export type MessageLogItem = {
  id: string;
  direction: string;
  type: string;
  templateKey: string | null;
  status: string;
  result: string | null;
  errorCode: string | null;
  relatedType: string | null;
  relatedId: string | null;
  createdAt: string;
};

export type MessageLogListQuery = {
  from?: string;
  to?: string;
  result?: string;
  cursor?: string;
  limit?: number;
};

export type MessageLogListResult = {
  items: MessageLogItem[];
  nextCursor: string | null;
};
