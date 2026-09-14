'use client';

import { useDeferredValue, useEffect, useState } from 'react';
import { InboxConversationList } from '@/packages/messaging/components/Inbox/InboxConversationList';
import { InboxPatientPanel } from '@/packages/messaging/components/Inbox/InboxPatientPanel';
import { InboxThread } from '@/packages/messaging/components/Inbox/InboxThread';
import type { ConversationStatus } from '@/packages/messaging/enum/Conversation/ConversationStatusEnum';
import { messagingErrorMessage } from '@/packages/messaging/helpers/MessagingErrorMessage';
import { useConversationListHook } from '@/packages/messaging/hooks/Conversation/useConversationListHook';
import { useConversationMarkReadHook } from '@/packages/messaging/hooks/Conversation/useConversationMarkReadHook';
import { useConversationUpdateHook } from '@/packages/messaging/hooks/Conversation/useConversationUpdateHook';
import { useMessageListHook } from '@/packages/messaging/hooks/Message/useMessageListHook';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Skeleton } from '@/shared/ui/skeleton';

export function InboxIndex() {
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [statusFilter, setStatusFilter] = useState<ConversationStatus | 'ALL'>('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const listQuery = useConversationListHook({
    q: deferredSearch.trim() || undefined,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    limit: 50,
  });
  const messagesQuery = useMessageListHook(selectedId);
  const markRead = useConversationMarkReadHook();
  const updateConversation = useConversationUpdateHook();

  const items = listQuery.data?.items ?? [];
  const selected = items.find((item) => item.id === selectedId) ?? null;

  useEffect(() => {
    if (!selectedId && items.length > 0) {
      setSelectedId(items[0]!.id);
    }
  }, [items, selectedId]);

  useEffect(() => {
    if (!selected || selected.unreadCount <= 0 || markRead.isPending) return;
    void markRead.mutateAsync(selected.id);
  }, [selected?.id, selected?.unreadCount]); // eslint-disable-line react-hooks/exhaustive-deps

  if (listQuery.isLoading) {
    return (
      <div className="grid gap-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-[70vh] w-full" />
      </div>
    );
  }

  if (listQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{messagingErrorMessage(listQuery.error)}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid h-[calc(100vh-8rem)] min-h-[28rem] gap-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Inbox</h1>
          <p className="text-sm text-muted-foreground">
            Caixa de entrada WhatsApp compartilhada. Sem bloqueio de janela de 24h.
          </p>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden rounded-lg border md:grid-cols-[minmax(14rem,18rem)_minmax(0,1fr)] 2xl:grid-cols-[minmax(14rem,17rem)_minmax(0,1fr)_minmax(14rem,16rem)]">
        <InboxConversationList
          items={items}
          selectedId={selectedId}
          search={search}
          statusFilter={statusFilter}
          onSearchChange={setSearch}
          onStatusFilterChange={setStatusFilter}
          onSelect={setSelectedId}
        />
        <InboxThread
          conversation={selected}
          messages={messagesQuery.data?.items ?? []}
          isLoading={Boolean(selectedId) && messagesQuery.isLoading}
          resolvePending={updateConversation.isPending}
          onResolve={() => {
            if (!selectedId) return;
            void updateConversation.mutateAsync({
              conversationId: selectedId,
              conversationSchema: { status: 'CLOSED' },
            });
          }}
        />
        <InboxPatientPanel conversation={selected} />
      </div>
    </div>
  );
}
