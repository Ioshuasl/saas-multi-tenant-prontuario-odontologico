'use client';

import {
  WHATSAPP_ACCOUNT_STATUS_LABELS,
  type WhatsappAccountStatus,
} from '@/packages/messaging/enum/Account/WhatsappAccountStatusEnum';
import { messagingErrorMessage } from '@/packages/messaging/helpers/MessagingErrorMessage';
import { AccountLogList } from '@/packages/messaging/components/Account/AccountLogList';
import { AccountUsageSection } from '@/packages/messaging/components/Account/AccountUsageSection';
import { useAccountCreateHook } from '@/packages/messaging/hooks/Account/useAccountCreateHook';
import { useAccountDeleteHook } from '@/packages/messaging/hooks/Account/useAccountDeleteHook';
import { useAccountFormHook } from '@/packages/messaging/hooks/Account/useAccountFormHook';
import { useAccountGetHook } from '@/packages/messaging/hooks/Account/useAccountGetHook';
import { useAccountTestHook } from '@/packages/messaging/hooks/Account/useAccountTestHook';
import { useAccountUpdateHook } from '@/packages/messaging/hooks/Account/useAccountUpdateHook';
import type { AccountConnectFormValues } from '@/packages/messaging/schemas/Account/AccountSchema';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { Skeleton } from '@/shared/ui/skeleton';
import { Switch } from '@/shared/ui/switch';

function statusLabel(status: string): string {
  if (status in WHATSAPP_ACCOUNT_STATUS_LABELS) {
    return WHATSAPP_ACCOUNT_STATUS_LABELS[status as WhatsappAccountStatus];
  }
  return status;
}

export function AccountForm() {
  const accountQuery = useAccountGetHook();
  const form = useAccountFormHook();
  const connect = useAccountCreateHook();
  const test = useAccountTestHook();
  const patch = useAccountUpdateHook();
  const disconnect = useAccountDeleteHook();

  const account = accountQuery.data;
  const hasAccount = Boolean(account);
  const error =
    connect.error ?? test.error ?? patch.error ?? disconnect.error ?? accountQuery.error;

  const onConnect = async (values: AccountConnectFormValues) => {
    await connect.mutateAsync(values);
    form.reset();
  };

  if (accountQuery.isLoading) {
    return (
      <div className="mx-auto grid max-w-2xl gap-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-2xl gap-4">
      <header>
        <h1 className="text-xl font-semibold">WhatsApp</h1>
        <p className="text-sm text-muted-foreground">
          Conecte a conta da clínica, teste o envio e acompanhe créditos e logs.
        </p>
      </header>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Não foi possível concluir</AlertTitle>
          <AlertDescription>{messagingErrorMessage(error)}</AlertDescription>
        </Alert>
      ) : null}

      {!hasAccount ? (
        <section className="rounded-lg border p-4">
          <h2 className="text-sm font-semibold">Conectar conta</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Use as credenciais da Cloud API (WABA). O token não fica visível depois de salvo.
          </p>
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              void form.handleSubmit(onConnect)(event);
            }}
          >
            <FieldGroup>
              <Field data-invalid={Boolean(form.formState.errors.wabaId)}>
                <FieldLabel htmlFor="waba-id">WABA ID</FieldLabel>
                <Input id="waba-id" autoComplete="off" {...form.register('wabaId')} />
                <FieldError>{form.formState.errors.wabaId?.message}</FieldError>
              </Field>
              <Field data-invalid={Boolean(form.formState.errors.phoneNumberId)}>
                <FieldLabel htmlFor="phone-number-id">Phone Number ID</FieldLabel>
                <Input id="phone-number-id" autoComplete="off" {...form.register('phoneNumberId')} />
                <FieldError>{form.formState.errors.phoneNumberId?.message}</FieldError>
              </Field>
              <Field data-invalid={Boolean(form.formState.errors.displayPhone)}>
                <FieldLabel htmlFor="display-phone">Telefone de exibição</FieldLabel>
                <Input id="display-phone" type="tel" {...form.register('displayPhone')} />
                <FieldError>{form.formState.errors.displayPhone?.message}</FieldError>
              </Field>
              <Field data-invalid={Boolean(form.formState.errors.accessToken)}>
                <FieldLabel htmlFor="access-token">Access token</FieldLabel>
                <Input id="access-token" type="password" autoComplete="off" {...form.register('accessToken')} />
                <FieldError>{form.formState.errors.accessToken?.message}</FieldError>
              </Field>
            </FieldGroup>
            <Button type="submit" disabled={connect.isPending}>
              {connect.isPending ? 'Conectando…' : 'Conectar'}
            </Button>
          </form>
        </section>
      ) : (
        <section className="grid gap-4 rounded-lg border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold">Conta</h2>
              <p className="text-sm text-muted-foreground">{account?.displayPhone}</p>
            </div>
            <Badge variant={account?.status === 'CONNECTED' ? 'default' : 'secondary'}>
              {statusLabel(account?.status ?? '')}
            </Badge>
          </div>

          {account?.status === 'ERROR' && account.lastError ? (
            <Alert variant="destructive">
              <AlertTitle>Erro acionável</AlertTitle>
              <AlertDescription>
                {account.lastError} Revise as credenciais ou envie o teste novamente.
              </AlertDescription>
            </Alert>
          ) : null}

          {account?.status === 'PENDING' || account?.status === 'ERROR' ? (
            <Button
              type="button"
              disabled={test.isPending}
              onClick={() => {
                void test.mutateAsync();
              }}
            >
              {test.isPending ? 'Testando…' : 'Enviar teste'}
            </Button>
          ) : null}

          {account?.status === 'CONNECTED' ? (
            <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
              <div>
                <p className="text-sm font-medium">Pausar envios (kill switch)</p>
                <p className="text-xs text-muted-foreground">
                  Desliga as automações do tenant. A agenda interna não bloqueia.
                </p>
              </div>
              <Switch
                checked={Boolean(account.killSwitch)}
                disabled={patch.isPending}
                onCheckedChange={(checked) => {
                  void patch.mutateAsync({ killSwitch: checked === true });
                }}
                aria-label="Kill switch"
              />
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {account?.status === 'CONNECTED' ? (
              <Button
                type="button"
                variant="outline"
                disabled={test.isPending}
                onClick={() => {
                  void test.mutateAsync();
                }}
              >
                {test.isPending ? 'Testando…' : 'Enviar teste'}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              disabled={disconnect.isPending}
              onClick={() => {
                void disconnect.mutateAsync();
              }}
            >
              {disconnect.isPending ? 'Desconectando…' : 'Desconectar'}
            </Button>
          </div>
        </section>
      )}

      <AccountUsageSection enabled={hasAccount} />
      <AccountLogList enabled={hasAccount} />
    </div>
  );
}
