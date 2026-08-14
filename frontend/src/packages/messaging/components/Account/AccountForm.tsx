'use client';

import { useState } from 'react';
import { Controller } from 'react-hook-form';
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
import { useAccountQrGetHook } from '@/packages/messaging/hooks/Account/useAccountQrGetHook';
import { useAccountTestHook } from '@/packages/messaging/hooks/Account/useAccountTestHook';
import { useAccountUpdateHook } from '@/packages/messaging/hooks/Account/useAccountUpdateHook';
import type { AccountConnectFormValues } from '@/packages/messaging/schemas/Account/AccountSchema';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { Skeleton } from '@/shared/ui/skeleton';
import { Switch } from '@/shared/ui/switch';

const RISK_COPY =
  'Declaro ciência: a conexão usa um cliente não oficial (WAHA), em desacordo com os termos da Meta; há risco de bloqueio permanente; usarei um número dedicado, não o WhatsApp principal da clínica nem um número pessoal.';

function statusLabel(status: string): string {
  if (status in WHATSAPP_ACCOUNT_STATUS_LABELS) {
    return WHATSAPP_ACCOUNT_STATUS_LABELS[status as WhatsappAccountStatus];
  }
  return status;
}

function qrImageSrc(qr: string): string | null {
  if (qr.startsWith('data:') || qr.startsWith('http://') || qr.startsWith('https://')) return qr;
  if (qr.length > 80 && /^[A-Za-z0-9+/=\s]+$/.test(qr)) {
    return `data:image/png;base64,${qr.replace(/\s/g, '')}`;
  }
  return null;
}

export function AccountForm() {
  const accountQuery = useAccountGetHook();
  const form = useAccountFormHook();
  const connect = useAccountCreateHook();
  const test = useAccountTestHook();
  const patch = useAccountUpdateHook();
  const disconnect = useAccountDeleteHook();
  const [testTo, setTestTo] = useState('');
  const [testSentTo, setTestSentTo] = useState<string | null>(null);

  const account = accountQuery.data;
  const hasAccount = Boolean(account);
  const waitingQr = account?.status === 'PENDING';
  const qrQuery = useAccountQrGetHook(waitingQr);
  const error =
    connect.error ?? test.error ?? patch.error ?? disconnect.error ?? accountQuery.error ?? qrQuery.error;

  const onConnect = async (_values: AccountConnectFormValues) => {
    await connect.mutateAsync({ riskAccepted: true });
    form.reset();
  };

  const onTest = async () => {
    const to = testTo.replace(/\D/g, '');
    if (to.length < 10) return;
    await test.mutateAsync({ to });
    setTestSentTo(to);
  };

  if (accountQuery.isLoading) {
    return (
      <div className="mx-auto grid max-w-2xl gap-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const qr = qrQuery.data?.qr ?? null;
  const qrSrc = qr ? qrImageSrc(qr) : null;

  return (
    <div className="mx-auto grid max-w-2xl gap-4">
      <header>
        <h1 className="text-xl font-semibold">WhatsApp</h1>
        <p className="text-sm text-muted-foreground">
          Conecte o número da clínica pelo QR, teste o envio e acompanhe volume e logs.
        </p>
      </header>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Não foi possível concluir</AlertTitle>
          <AlertDescription>{messagingErrorMessage(error)}</AlertDescription>
        </Alert>
      ) : null}

      {test.isSuccess && testSentTo ? (
        <Alert>
          <AlertTitle>Teste enviado</AlertTitle>
          <AlertDescription>
            Mensagem enviada para {testSentTo}. Ela aparece no WhatsApp desse destinatário, não no número da
            sessão Ioshua.
          </AlertDescription>
        </Alert>
      ) : null}

      {!hasAccount ? (
        <section className="rounded-lg border p-4">
          <h2 className="text-sm font-semibold">Conectar conta</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            O QR aparece nesta tela. A clínica não usa o painel do WAHA.
          </p>
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              void form.handleSubmit(onConnect)(event);
            }}
          >
            <FieldGroup>
              <Field data-invalid={Boolean(form.formState.errors.riskAccepted)}>
                <div className="flex items-start gap-3">
                  <Controller
                    control={form.control}
                    name="riskAccepted"
                    render={({ field }) => (
                      <Checkbox
                        id="risk-accepted"
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked === true);
                        }}
                      />
                    )}
                  />
                  <FieldLabel htmlFor="risk-accepted" className="font-normal leading-5">
                    {RISK_COPY}
                  </FieldLabel>
                </div>
                <FieldError>{form.formState.errors.riskAccepted?.message}</FieldError>
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
              <p className="text-sm text-muted-foreground">{account?.displayPhone ?? 'Número ainda não sincronizado'}</p>
            </div>
            <Badge variant={account?.status === 'CONNECTED' ? 'default' : 'secondary'}>
              {statusLabel(account?.status ?? '')}
            </Badge>
          </div>

          {waitingQr ? (
            <div className="grid gap-2">
              <p className="text-sm font-medium">Escaneie o QR no WhatsApp do número dedicado</p>
              {qrSrc ? (
                <img alt="QR Code WhatsApp" className="h-48 w-48 rounded-md border bg-white p-2" src={qrSrc} />
              ) : qr ? (
                <p className="break-all font-mono text-xs text-muted-foreground">{qr}</p>
              ) : (
                <Skeleton className="h-48 w-48" />
              )}
            </div>
          ) : null}

          {account?.status === 'ERROR' && account.lastError ? (
            <Alert variant="destructive">
              <AlertTitle>Erro acionável</AlertTitle>
              <AlertDescription>
                {account.lastError} Revise a sessão ou envie o teste novamente.
              </AlertDescription>
            </Alert>
          ) : null}

          <Field>
            <FieldLabel htmlFor="test-to">Número que receberá o teste</FieldLabel>
            <Input
              id="test-to"
              type="tel"
              inputMode="tel"
              placeholder="5562999999999"
              value={testTo}
              onChange={(event) => {
                setTestTo(event.target.value);
                setTestSentTo(null);
              }}
            />
            <p className="text-xs text-muted-foreground">
              Use um celular com DDI (55). Não use o mesmo número da sessão conectada — o WhatsApp não mostra
              conversa consigo mesmo.
            </p>
          </Field>

          {account?.status === 'PENDING' || account?.status === 'ERROR' || account?.status === 'CONNECTED' ? (
            <Button
              type="button"
              variant={account.status === 'CONNECTED' ? 'outline' : 'default'}
              disabled={test.isPending || testTo.replace(/\D/g, '').length < 10}
              onClick={() => {
                void onTest();
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
