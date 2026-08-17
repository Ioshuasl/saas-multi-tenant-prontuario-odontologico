'use client';

import { CONVERSATION_STATUS_LABELS } from '@/packages/messaging/enum/Conversation/ConversationStatusEnum';
import { formatConversationTime } from '@/packages/messaging/helpers/ConversationTime';
import type { ConversationListProps } from '@/packages/messaging/types/Conversation/ConversationListTypes';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/helpers/utils';

function sortInbox(items: ConversationListProps['conversations']) {
  return [...items].sort((a, b) => {
    const unread = Number(b.unreadCount > 0) - Number(a.unreadCount > 0);
    if (unread !== 0) return unread;
    const pending = Number(b.status === 'PENDING') - Number(a.status === 'PENDING');
    if (pending !== 0) return pending;
    return (b.lastMessageAt ?? '').localeCompare(a.lastMessageAt ?? '');
  });
}

export function ConversationList({ conversations, selectedId, onSelect }: ConversationListProps) {
  const items = sortInbox(conversations);

  if (items.length === 0) {
    return (
      <p className="px-3 text-sm text-muted-foreground">Nenhuma conversa encontrada.</p>
    );
  }

  return (
    <ul className="grid">
      {items.map((conversation) => {
        const title = conversation.contactName || conversation.contactPhone;
        const selected = conversation.id === selectedId;
        return (
          <li key={conversation.id}>
            <button
              type="button"
              onClick={() => onSelect(conversation.id)}
              className={cn(
                'flex w-full flex-col gap-1 border-b px-3 py-3 text-left text-sm hover:bg-muted/60',
                selected && 'bg-muted',
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="truncate font-medium">{title}</span>
                {conversation.unreadCount > 0 ? (
                  <Badge variant="default">{conversation.unreadCount}</Badge>
                ) : null}
              </span>
              <span className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>{CONVERSATION_STATUS_LABELS[conversation.status]}</span>
                <span>{formatConversationTime(conversation.lastMessageAt)}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
