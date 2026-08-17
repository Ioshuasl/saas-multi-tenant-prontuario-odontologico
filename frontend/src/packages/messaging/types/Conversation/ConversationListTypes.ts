import type { ConversationStatus } from '@/packages/messaging/enum/Conversation/ConversationStatusEnum';
import type { ConversationSummary } from '@/packages/messaging/types/Conversation/ConversationTypes';

export type ConversationListProps = {
  conversations: ConversationSummary[];
  selectedId: string | null;
  onSelect: (conversationId: string) => void;
};

export type ConversationFilterProps = {
  search: string;
  status: ConversationStatus | '';
  onSearchChange: (value: string) => void;
  onStatusChange: (value: ConversationStatus | '') => void;
};
