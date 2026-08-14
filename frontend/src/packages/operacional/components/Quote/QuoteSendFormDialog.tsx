'use client';

import { useState } from 'react';
import {
  QUOTE_SEND_CHANNELS,
  QUOTE_SEND_CHANNEL_LABELS,
} from '@/packages/operacional/enum/Quote/QuoteSendChannelEnum';
import { operacionalErrorMessage } from '@/packages/operacional/helpers/OperacionalErrorMessage';
import { useQuoteSendFormHook } from '@/packages/operacional/hooks/Quote/useQuoteSendFormHook';
import { useQuoteSendHook } from '@/packages/operacional/hooks/Quote/useQuoteSendHook';
import type { QuoteSendFormValues } from '@/packages/operacional/schemas/Quote/QuoteSendSchema';
import type { QuoteSendFormDialogProps } from '@/packages/operacional/types/Quote/QuoteSendFormDialogTypes';
import type { QuoteSendResult } from '@/packages/operacional/types/Quote/QuoteTypes';
import { MotionDialogBody } from '@/shared/motion/MotionDialogBody';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { NativeSelect, NativeSelectOption } from '@/shared/ui/native-select';

export function QuoteSendFormDialog({ quoteId, onClose }: QuoteSendFormDialogProps) {
  const form = useQuoteSendFormHook();
  const send = useQuoteSendHook(quoteId);
  const [result, setResult] = useState<QuoteSendResult | null>(null);
  const [copied, setCopied] = useState(false);

  const onSave = async (values: QuoteSendFormValues) => {
    setCopied(false);
    const data = await send.mutateAsync(values);
    setResult(data);
  };

  const onCopy = async () => {
    if (!result?.publicUrl) return;
    await navigator.clipboard.writeText(result.publicUrl);
    setCopied(true);
  };

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <MotionDialogBody>
          <DialogHeader>
            <DialogTitle>Enviar orçamento</DialogTitle>
          </DialogHeader>

          {result ? (
            <div className="grid gap-3">
              <Alert>
                <AlertDescription>
                  Enviado via {QUOTE_SEND_CHANNEL_LABELS[result.sentVia]}. O PDF é gerado em
                  segundo plano.
                </AlertDescription>
              </Alert>
              {result.publicUrl ? (
                <Field>
                  <FieldLabel htmlFor="quote-public-url">Link público</FieldLabel>
                  <Input id="quote-public-url" readOnly value={result.publicUrl} />
                  <Button type="button" variant="outline" onClick={() => void onCopy()}>
                    {copied ? 'Copiado' : 'Copiar link'}
                  </Button>
                </Field>
              ) : null}
              <DialogFooter>
                <Button type="button" onClick={onClose}>
                  Fechar
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form
              className="grid gap-4"
              onSubmit={(event) => {
                void form.handleSubmit(onSave)(event);
              }}
            >
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="quote-channel">Canal</FieldLabel>
                  <NativeSelect
                    id="quote-channel"
                    value={form.watch('channel')}
                    onChange={(event) =>
                      form.setValue('channel', event.target.value as QuoteSendFormValues['channel'])
                    }
                  >
                    {QUOTE_SEND_CHANNELS.map((channel) => (
                      <NativeSelectOption key={channel} value={channel}>
                        {QUOTE_SEND_CHANNEL_LABELS[channel]}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
              </FieldGroup>
              {send.isError ? (
                <Alert variant="destructive">
                  <AlertDescription>{operacionalErrorMessage(send.error)}</AlertDescription>
                </Alert>
              ) : null}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={send.isPending}>
                  {send.isPending ? 'Enviando…' : 'Enviar'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </MotionDialogBody>
      </DialogContent>
    </Dialog>
  );
}
