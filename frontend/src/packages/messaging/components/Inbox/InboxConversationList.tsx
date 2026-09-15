'use client';

import { SearchIcon } from 'lucide-react';
import {
  CONVERSATION_STATUS_LABELS,
  type ConversationStatus,
} from '@/packages/messaging/enum/Conversation/ConversationStatusEnum';
import type { ConversationSummary } from '@/packages/messaging/types/Conversation/ConversationTypes';
import { cn } from '@/shared/helpers/utils';
import { Badge } from '@/shared/ui/badge';
import { Input } from '@/shared/ui/input';
import { ScrollArea } from '@/shared/ui/scroll-area';

type InboxConversationListProps = {
  items: ConversationSummary[];
  selectedId: string | null;
  search: string;
  statusFilter: ConversationStatus | 'ALL';
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: ConversationStatus | 'ALL') => void;
  onSelect: (conversationId: string) => void;
};

const FILTERS = [
  { value: 'ALL' as const, label: 'Todas' },
  { value: 'OPEN' as const, label: CONVERSATION_STATUS_LABELS.OPEN },
  { value: 'PENDING' as const, label: CONVERSATION_STATUS_LABELS.PENDING },
  { value: 'CLOSED' as const, label: CONVERSATION_STATUS_LABELS.CLOSED },
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
  }
  return (parts[0] ?? '?').slice(0, 2).toUpperCase();
}

function formatWhen(iso: string | null): string {
  if (!iso) return '';
  try {
    const date = new Date(iso);
    const now = new Date();
    const sameDay =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();
    if (sameDay) {
      return new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    }
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    }).format(date);
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
    <div className="flex h-full min-h-0 flex-col bg-card">
      <div className="grid shrink-0 gap-3 border-b border-border p-3">
        <div className="relative">
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="inbox-search"
            aria-label="Buscar conversa por nome ou telefone"
            placeholder="Buscar nome ou telefone…"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="h-9 pl-8"
          />
        </div>

        <div
          className="flex flex-wrap gap-1"
          role="group"
          aria-label="Filtrar por status da conversa"
        >
          {FILTERS.map((filter) => {
            const active = statusFilter === filter.value;
            return (
              <button
                key={filter.value}
                type="button"
                aria-pressed={active}
                className={cn(
                  'inline-flex h-8 cursor-pointer items-center rounded-full px-3 text-[12px] font-medium transition-colors duration-150',
                  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                )}
                onClick={() => onStatusFilterChange(filter.value)}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <ul className="divide-y divide-border" aria-label="Lista de conversas">
          {items.length === 0 ? (
            <li className="px-4 py-10 text-center">
              <p className="text-sm font-medium text-foreground">Nenhuma conversa</p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Quando alguém escrever no WhatsApp da clínica, a conversa aparece aqui.
              </p>
            </li>
          ) : (
            items.map((item) => {
              const title = item.contactName?.trim() || item.contactPhone;
              const selected = item.id === selectedId;
              const unread = item.unreadCount > 0;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-current={selected ? 'true' : undefined}
                    className={cn(
                      'flex min-h-14 w-full cursor-pointer items-start gap-3 px-3 py-3 text-left transition-colors duration-150',
                      'hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                      selected && 'bg-muted/70',
                    )}
                    onClick={() => onSelect(item.id)}
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold',
                        selected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-primary',
                      )}
                      aria-hidden
                    >
                      {initials(title)}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span
                          className={cn(
                            'truncate text-[14px]',
                            unread ? 'font-semibold text-foreground' : 'font-medium text-foreground',
                          )}
                        >
                          {title}
                        </span>
                        <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                          {formatWhen(item.lastMessageAt)}
                        </span>
                      </span>

                      <span className="mt-0.5 flex items-center gap-2">
                        <span className="truncate text-[12px] text-muted-foreground">
                          {item.contactPhone}
                        </span>
                        {item.status === 'PENDING' ? (
                          <Badge variant="secondary" className="ml-auto shrink-0 text-[10px]">
                            {CONVERSATION_STATUS_LABELS.PENDING}
                          </Badge>
                        ) : null}
                        {unread ? (
                          <Badge
                            variant="default"
                            className={cn(
                              'shrink-0 tabular-nums',
                              item.status !== 'PENDING' && 'ml-auto',
                            )}
                            aria-label={`${item.unreadCount} não lidas`}
                          >
                            {item.unreadCount}
                          </Badge>
                        ) : null}
                      </span>
                    </span>
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
