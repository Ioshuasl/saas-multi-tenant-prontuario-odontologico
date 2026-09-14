'use client';

import { useEffect, useRef, useState } from 'react';
import { messagingErrorMessage } from '@/packages/messaging/helpers/MessagingErrorMessage';
import { useMessageSendHook } from '@/packages/messaging/hooks/Message/useMessageSendHook';
import type { ConversationSummary } from '@/packages/messaging/types/Conversation/ConversationTypes';
import type { InboxMessage } from '@/packages/messaging/types/Message/MessageTypes';
import { Can } from '@/shared/auth/Can';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Textarea } from '@/shared/ui/textarea';
import { cn } from '@/shared/helpers/utils';

type InboxThreadProps = {
  conversation: ConversationSummary | null;
  messages: InboxMessage[];
  isLoading: boolean;
  onResolve: () => void;
  resolvePending: boolean;
};

function formatMessageTime(iso: string): string {
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

export function InboxThread({
  conversation,
  messages,
  isLoading,
  onResolve,
  resolvePending,
}: InboxThreadProps) {
  const send = useMessageSendHook();
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setDraft('');
  }, [conversation?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, conversation?.id]);

  if (!conversation) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
        Selecione uma conversa para ler e responder.
      </div>
    );
  }

  const title = conversation.contactName?.trim() || conversation.contactPhone;

  const onSend = async () => {
    const text = draft.trim();
    if (!text || send.isPending) return;
    await send.mutateAsync({
      conversationId: conversation.id,
      messageSchema: { text },
      idempotencyKey: crypto.randomUUID(),
    });
    setDraft('');
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold">{title}</h2>
          <p className="truncate text-xs text-muted-foreground">{conversation.contactPhone}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant="outline">{conversation.status}</Badge>
          {conversation.status !== 'CLOSED' ? (
            <Can permission="messaging.write">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={resolvePending}
                onClick={onResolve}
              >
                Resolver
              </Button>
            </Can>
          ) : null}
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1 px-4 py-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando mensagens…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ainda não há mensagens nesta conversa.</p>
        ) : (
          <ul className="grid gap-2" aria-label="Mensagens da conversa">
            {messages.map((message) => {
              const outbound = message.direction === 'OUTBOUND';
              return (
                <li
                  key={message.id}
                  className={cn('flex', outbound ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                      outbound
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground',
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">
                      {message.body?.trim() ||
                        (message.mediaKey ? '[Mídia]' : '[Sem conteúdo]')}
                    </p>
                    <p
                      className={cn(
                        'mt-1 text-[10px]',
                        outbound ? 'text-primary-foreground/80' : 'text-muted-foreground',
                      )}
                    >
                      {formatMessageTime(message.createdAt)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div ref={bottomRef} />
      </ScrollArea>

      <div className="grid gap-2 border-t p-3">
        {send.error ? (
          <Alert variant="destructive">
            <AlertDescription>{messagingErrorMessage(send.error)}</AlertDescription>
          </Alert>
        ) : null}
        <Can
          permission="messaging.write"
          fallback={
            <p className="text-sm text-muted-foreground">
              Você pode ler a conversa, mas não tem permissão para responder.
            </p>
          }
        >
          <Textarea
            aria-label="Mensagem"
            placeholder="Escreva a resposta…"
            rows={3}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                void onSend();
              }
            }}
          />
          <div className="flex justify-end">
            <Button
              type="button"
              disabled={!draft.trim() || send.isPending}
              onClick={() => void onSend()}
            >
              {send.isPending ? 'Enviando…' : 'Enviar'}
            </Button>
          </div>
        </Can>
      </div>
    </div>
  );
}
