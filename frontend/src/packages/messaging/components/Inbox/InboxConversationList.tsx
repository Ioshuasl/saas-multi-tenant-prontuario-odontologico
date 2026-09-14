'use client';

import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { cn } from '@/shared/helpers/utils';
import {
  CONVERSATION_STATUS_LABELS,
  type ConversationStatus,
} from '@/packages/messaging/enum/Conversation/ConversationStatusEnum';
import type { ConversationSummary } from '@/packages/messaging/types/Conversation/ConversationTypes';

type InboxConversationListProps = {
  items: ConversationSummary[];
  selectedId: string | null;
  search: string;
  statusFilter: ConversationStatus | 'ALL';
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: ConversationStatus | 'ALL') => void;
  onSelect: (conversationId: string) => void;
};

function statusLabel(status: string): string {
  if (status in CONVERSATION_STATUS_LABELS) {
    return CONVERSATION_STATUS_LABELS[status as ConversationStatus];
  }
  return status;
}

function formatWhen(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

export function InboxConversationList({
  items,
  selectedId,
  search,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
  onSelect,
}: InboxConversationListProps) {
  return (
    <div className="flex h-full min-h-0 flex-col border-r">
      <div className="grid gap-2 border-b p-3">
        <Input
          aria-label="Buscar conversa"
          placeholder="Nome ou telefone"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        <div className="flex flex-wrap gap-1">
          {(['ALL', 'OPEN', 'PENDING', 'CLOSED'] as const).map((value) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={statusFilter === value ? 'default' : 'outline'}
              onClick={() => onStatusFilterChange(value)}
            >
              {value === 'ALL' ? 'Todas' : statusLabel(value)}
            </Button>
          ))}
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <ul className="divide-y" aria-label="Lista de conversas">
          {items.length === 0 ? (
            <li className="p-4 text-sm text-muted-foreground">Nenhuma conversa encontrada.</li>
          ) : (
            items.map((item) => {
              const title = item.contactName?.trim() || item.contactPhone;
              const selected = item.id === selectedId;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full flex-col gap-1 px-3 py-3 text-left transition-colors hover:bg-muted/60',
                      selected && 'bg-muted',
                    )}
                    onClick={() => onSelect(item.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="truncate text-sm font-medium">{title}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatWhen(item.lastMessageAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="truncate text-xs text-muted-foreground">
                        {item.contactPhone}
                      </span>
                      {item.unreadCount > 0 ? (
                        <Badge variant="default" className="ml-auto tabular-nums">
                          {item.unreadCount}
                        </Badge>
                      ) : null}
                      {item.status === 'PENDING' ? (
                        <Badge variant="secondary">{statusLabel('PENDING')}</Badge>
                      ) : null}
                    </div>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </ScrollArea>
    </div>
  );
}
