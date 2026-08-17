'use client';

import { useDeferredValue, useState } from 'react';
import Link from 'next/link';
import { ConversationFilter } from '@/packages/messaging/components/Conversation/ConversationFilter';
import { ConversationList } from '@/packages/messaging/components/Conversation/ConversationList';
import { ConversationPatientPanel } from '@/packages/messaging/components/Conversation/ConversationPatientPanel';
import { ConversationThread } from '@/packages/messaging/components/Conversation/ConversationThread';
import type { ConversationStatus } from '@/packages/messaging/enum/Conversation/ConversationStatusEnum';
import { messagingErrorMessage } from '@/packages/messaging/helpers/MessagingErrorMessage';
import { useConversationListHook } from '@/packages/messaging/hooks/Conversation/useConversationListHook';
import { useConversationReadHook } from '@/packages/messaging/hooks/Conversation/useConversationReadHook';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { ScrollArea } from '@/shared/ui/scroll-area';

export function ConversationIndex() {
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [status, setStatus] = useState<ConversationStatus | ''>('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const listQuery = useConversationListHook({
    q: deferredSearch.trim() || undefined,
    status: status || undefined,
    limit: 50,
  });
  const read = useConversationReadHook();

  const onSelect = (conversationId: string) => {
    setSelectedId(conversationId);
    void read.mutateAsync(conversationId);
  };

  if (listQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando inbox…</p>;
  }

  if (listQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{messagingErrorMessage(listQuery.error)}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid min-h-0 gap-4 lg:h-[calc(100vh-7.5rem)]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Inbox</h1>
          <p className="text-sm text-muted-foreground">
            Conversas do WhatsApp da clínica. Envio liberado a qualquer momento — sem janela de 24h.
          </p>
        </div>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/app/whatsapp" prefetch={false} />}
        >
          Configurar WhatsApp
        </Button>
      </div>

      <div className="grid min-h-0 overflow-hidden rounded-xl ring-1 ring-foreground/10 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        <section className="flex min-h-0 flex-col border-b lg:border-r lg:border-b-0">
          <div className="px-3 pt-3 pb-2">
            <h2 className="text-sm font-medium">Conversas</h2>
          </div>
          <ConversationFilter
            search={search}
            status={status}
            onSearchChange={setSearch}
            onStatusChange={setStatus}
          />
          <ScrollArea className="min-h-0 flex-1">
            <ConversationList
              conversations={listQuery.data?.items ?? []}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          </ScrollArea>
        </section>

        <section className="flex min-h-[360px] min-w-0 flex-col border-b lg:border-r lg:border-b-0">
          {selectedId ? (
            <ConversationThread conversationId={selectedId} />
          ) : (
            <p className="m-auto p-6 text-sm text-muted-foreground">
              Selecione uma conversa para ler e responder.
            </p>
          )}
        </section>

        <aside className="min-h-0 overflow-auto">
          {selectedId ? (
            <ConversationPatientPanel conversationId={selectedId} />
          ) : (
            <p className="p-4 text-sm text-muted-foreground">
              O painel do paciente aparece ao abrir uma conversa.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
