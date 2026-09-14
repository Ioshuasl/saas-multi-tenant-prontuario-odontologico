'use client';

import { formatConversationTime, formatMessageTime } from '@/packages/messaging/helpers/ConversationTime';
import { messagingErrorMessage } from '@/packages/messaging/helpers/MessagingErrorMessage';
import { useConversationGetHook } from '@/packages/messaging/hooks/Conversation/useConversationGetHook';
import { useMessageListHook } from '@/packages/messaging/hooks/Message/useMessageListHook';
import { MessageComposer } from '@/packages/messaging/components/Message/MessageComposer';
import type { ConversationThreadProps } from '@/packages/messaging/types/Conversation/ConversationPanelTypes';
import { Can } from '@/shared/auth/Can';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { cn } from '@/shared/helpers/utils';
import { ScrollArea } from '@/shared/ui/scroll-area';

function messageLabel(type: string, body: string | null): string {
  if (body?.trim()) return body;
  if (type === 'IMAGE') return 'Imagem';
  if (type === 'DOCUMENT') return 'Documento';
  return 'Mensagem';
}

export function ConversationThread({ conversationId }: ConversationThreadProps) {
  const conversationQuery = useConversationGetHook(conversationId);
  const messagesQuery = useMessageListHook(conversationId);
  const conversation = conversationQuery.data;
  const closed = conversation?.status === 'CLOSED';
  const messages = [...(messagesQuery.data?.items ?? [])].reverse();

  if (conversationQuery.isLoading || messagesQuery.isLoading) {
    return <p className="p-4 text-sm text-muted-foreground">Carregando conversa…</p>;
  }

  if (conversationQuery.isError) {
    return (
      <Alert variant="destructive" className="m-3">
        <AlertDescription>{messagingErrorMessage(conversationQuery.error)}</AlertDescription>
      </Alert>
    );
  }

  if (messagesQuery.isError) {
    return (
      <Alert variant="destructive" className="m-3">
        <AlertDescription>{messagingErrorMessage(messagesQuery.error)}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b px-4 py-3">
        <p className="font-medium">
          {conversation?.contactName || conversation?.contactPhone}
        </p>
        <p className="text-xs text-muted-foreground">
          {conversation?.contactPhone}
          {conversation?.lastMessageAt
            ? ` · última mensagem ${formatConversationTime(conversation.lastMessageAt)}`
            : null}
        </p>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="grid gap-2 p-4">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma mensagem nesta conversa.</p>
          ) : (
            messages.map((message) => {
              const outbound = message.direction === 'OUTBOUND';
              return (
                <div
                  key={message.id}
                  className={cn('flex', outbound ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'max-w-[80%] rounded-lg px-3 py-2 text-sm',
                      outbound ? 'bg-primary text-primary-foreground' : 'bg-muted',
                    )}
                  >
                    <p className="whitespace-pre-wrap">{messageLabel(message.type, message.body)}</p>
                    <p
                      className={cn(
                        'mt-1 text-[11px]',
                        outbound ? 'text-primary-foreground/80' : 'text-muted-foreground',
                      )}
                    >
                      {formatMessageTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {closed ? (
        <p className="border-t px-3 py-2 text-sm text-muted-foreground">
          Conversa resolvida. Reabra no painel ao lado para responder.
        </p>
      ) : (
        <Can
          permission="messaging.write"
          fallback={
            <p className="border-t px-3 py-2 text-sm text-muted-foreground">
              Sem permissão para responder.
            </p>
          }
        >
          <MessageComposer conversationId={conversationId} />
        </Can>
      )}
    </div>
  );
}
