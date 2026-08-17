import type { ConversationStatus } from '../../enum/message/message.enum.js';

export type ConversationContextAction = {
  key: 'SCHEDULE' | 'QUOTE' | 'ANAMNESIS' | 'RECEIPT' | 'CHARGE';
  label: string;
  href: string;
};

export type ConversationSummary = {
  id: string;
  patientId: string | null;
  contactPhone: string;
  contactName: string | null;
  status: ConversationStatus;
  assignedToUserId: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  createdAt: string;
};

export type ConversationListResult = {
  items: ConversationSummary[];
  nextCursor: string | null;
};

export type ConversationDetail = ConversationSummary & {
  contextActions: ConversationContextAction[];
};

export type ConversationMediaPresignResult = {
  uploadUrl: string;
  method: 'PUT';
  headers: Record<string, string>;
  storageKey: string;
  expiresIn: number;
};
