'use client';

import { useRef } from 'react';
import { messagingErrorMessage } from '@/packages/messaging/helpers/MessagingErrorMessage';
import { useMessageCreateHook } from '@/packages/messaging/hooks/Message/useMessageCreateHook';
import { useMessageFormHook } from '@/packages/messaging/hooks/Message/useMessageFormHook';
import type { MessageCreateFormValues } from '@/packages/messaging/schemas/Message/MessageSchema';
import type { MessageComposerProps } from '@/packages/messaging/types/Message/MessageFormTypes';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';

export function MessageComposer({ conversationId, disabled = false }: MessageComposerProps) {
  const form = useMessageFormHook();
  const create = useMessageCreateHook(conversationId);
  const idempotencyKey = useRef(crypto.randomUUID());

  const onSend = async (values: MessageCreateFormValues) => {
    await create.mutateAsync({
      messageCreateSchema: { text: values.text },
      idempotencyKey: idempotencyKey.current,
    });
    idempotencyKey.current = crypto.randomUUID();
    form.reset({ text: '' });
  };

  return (
    <form
      className="grid gap-2 border-t p-3"
      onSubmit={(e) => {
        void form.handleSubmit(onSend)(e);
      }}
    >
      <Textarea
        rows={3}
        placeholder="Escreva uma mensagem…"
        aria-label="Mensagem"
        disabled={disabled || create.isPending}
        {...form.register('text')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void form.handleSubmit(onSend)();
          }
        }}
      />
      {form.formState.errors.text ? (
        <p className="text-xs text-destructive">{form.formState.errors.text.message}</p>
      ) : null}
      {create.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{messagingErrorMessage(create.error)}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" disabled={disabled || create.isPending} className="w-fit">
        {create.isPending ? 'Enviando…' : 'Enviar'}
      </Button>
    </form>
  );
}
