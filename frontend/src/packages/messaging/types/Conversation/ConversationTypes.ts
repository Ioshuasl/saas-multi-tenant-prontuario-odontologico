import type { ConversationStatus } from '@/packages/messaging/enum/Conversation/ConversationStatusEnum';

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

export type ConversationDetail = ConversationSummary & {
  contextActions: ConversationContextAction[];
};

export type ConversationListQuery = {
  status?: ConversationStatus;
  q?: string;
  unread?: boolean;
  patientId?: string;
  cursor?: string;
  limit?: number;
};

export type ConversationListResult = {
  items: ConversationSummary[];
  nextCursor: string | null;
};

export type ConversationUpdateInput = {
  assignedToUserId?: string | null;
  status?: ConversationStatus;
  patientId?: string | null;
};
