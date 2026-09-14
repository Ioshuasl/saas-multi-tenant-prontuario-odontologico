'use client';

import Link from 'next/link';
import { CONVERSATION_STATUS_LABELS } from '@/packages/messaging/enum/Conversation/ConversationStatusEnum';
import { messagingErrorMessage } from '@/packages/messaging/helpers/MessagingErrorMessage';
import { useConversationGetHook } from '@/packages/messaging/hooks/Conversation/useConversationGetHook';
import { useConversationUpdateHook } from '@/packages/messaging/hooks/Conversation/useConversationUpdateHook';
import type { ConversationPatientPanelProps } from '@/packages/messaging/types/Conversation/ConversationPanelTypes';
import { useAuth } from '@/shared/auth/AuthProvider';
import { Can } from '@/shared/auth/Can';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export function ConversationPatientPanel({ conversationId }: ConversationPatientPanelProps) {
  const { user } = useAuth();
  const conversationQuery = useConversationGetHook(conversationId);
  const update = useConversationUpdateHook(conversationId);
  const conversation = conversationQuery.data;

  if (conversationQuery.isLoading) {
    return <p className="p-4 text-sm text-muted-foreground">Carregando paciente…</p>;
  }

  if (conversationQuery.isError || !conversation) {
    return (
      <Alert variant="destructive" className="m-3">
        <AlertDescription>{messagingErrorMessage(conversationQuery.error)}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-3 p-3">
      <Card size="sm">
        <CardHeader>
          <CardTitle>Paciente</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          <p className="font-medium">{conversation.contactName || 'Contato sem nome'}</p>
          <p className="text-sm text-muted-foreground">{conversation.contactPhone}</p>
          <p className="text-sm">{CONVERSATION_STATUS_LABELS[conversation.status]}</p>
          {conversation.patientId ? (
            <Button
              variant="outline"
              size="sm"
              className="w-fit"
              nativeButton={false}
              render={<Link href={`/app/pacientes/${conversation.patientId}`} prefetch={false} />}
            >
              Abrir ficha
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Paciente ainda não vinculado a este telefone.
            </p>
          )}
        </CardContent>
      </Card>

      <Can permission="messaging.write">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Atendimento</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={update.isPending || conversation.assignedToUserId === user?.id}
              onClick={() => {
                if (!user?.id) return;
                void update.mutateAsync({ assignedToUserId: user.id });
              }}
            >
              Atribuir a mim
            </Button>
            {conversation.status === 'CLOSED' ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={update.isPending}
                onClick={() => {
                  void update.mutateAsync({ status: 'OPEN' });
                }}
              >
                Reabrir
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={update.isPending}
                onClick={() => {
                  void update.mutateAsync({ status: 'CLOSED' });
                }}
              >
                Marcar resolvida
              </Button>
            )}
            {update.isError ? (
              <Alert variant="destructive">
                <AlertDescription>{messagingErrorMessage(update.error)}</AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
        </Card>
      </Can>

      {conversation.contextActions.length > 0 ? (
        <Card size="sm">
          <CardHeader>
            <CardTitle>Ações</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {conversation.contextActions.map((action) => (
              <Button
                key={action.key}
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<Link href={action.href} prefetch={false} />}
              >
                {action.label}
              </Button>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
