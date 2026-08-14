'use client';

import { useEffect, useRef, useState } from 'react';
import { formatCents } from '@/packages/operacional/helpers/FormatCents';
import { operacionalErrorMessage } from '@/packages/operacional/helpers/OperacionalErrorMessage';
import { useQuoteDecisionFormHook } from '@/packages/operacional/hooks/Quote/useQuoteDecisionFormHook';
import { useQuoteDecisionHook } from '@/packages/operacional/hooks/Quote/useQuoteDecisionHook';
import { useQuoteGetHook } from '@/packages/operacional/hooks/Quote/useQuoteGetHook';
import {
  toQuoteDecisionPayload,
  type QuoteDecisionFormValues,
} from '@/packages/operacional/schemas/Quote/QuoteDecisionSchema';
import type { QuoteDecisionFormDialogProps } from '@/packages/operacional/types/Quote/QuoteDecisionFormDialogTypes';
import type { QuoteDecisionResult } from '@/packages/operacional/types/Quote/QuoteTypes';
import { MotionDialogBody } from '@/shared/motion/MotionDialogBody';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';

export function QuoteDecisionFormDialog({ quoteId, onClose }: QuoteDecisionFormDialogProps) {
  const quoteQuery = useQuoteGetHook(quoteId);
  const decide = useQuoteDecisionHook(quoteId);
  const form = useQuoteDecisionFormHook();
  const idempotencyKey = useRef(crypto.randomUUID());
  const [result, setResult] = useState<QuoteDecisionResult | null>(null);

  useEffect(() => {
    const items = quoteQuery.data?.items ?? [];
    if (items.length === 0) return;
    form.reset({
      ...form.getValues(),
      approvedItemIds: items.map((item) => item.id),
    });
  }, [quoteQuery.data, form]);

  const onSave = async (values: QuoteDecisionFormValues) => {
    const data = await decide.mutateAsync({
      quoteDecisionSchema: toQuoteDecisionPayload(values),
      idempotencyKey: idempotencyKey.current,
    });
    setResult(data);
  };

  const selected = new Set(form.watch('approvedItemIds'));
  const decision = form.watch('decision');

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <MotionDialogBody>
          <DialogHeader>
            <DialogTitle>Decisão presencial</DialogTitle>
          </DialogHeader>

          {result ? (
            <div className="grid gap-3">
              <Alert>
                <AlertDescription>
                  {result.status === 'REJECTED'
                    ? 'Orçamento recusado. Nenhum plano foi criado.'
                    : `Decisão registrada. Plano ${result.treatmentPlanId ?? ''}.`}
                </AlertDescription>
              </Alert>
              {result.receivable ? (
                <ul className="grid gap-1 text-sm">
                  <li>Entrada: {formatCents(result.receivable.downPaymentCents)}</li>
                  {result.receivable.installments.map((line) => (
                    <li key={line.number}>
                      Parcela {line.number} · {line.dueDate} · {formatCents(line.amountCents)}
                    </li>
                  ))}
                </ul>
              ) : null}
              <DialogFooter>
                <Button type="button" onClick={onClose}>
                  Fechar
                </Button>
              </DialogFooter>
            </div>
          ) : quoteQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : (
            <form
              className="grid gap-4"
              onSubmit={(event) => {
                void form.handleSubmit(onSave)(event);
              }}
            >
              <FieldGroup>
                {(quoteQuery.data?.items ?? []).map((item) => (
                  <div key={item.id} className="flex items-start gap-2">
                    <Checkbox
                      id={`quote-decide-item-${item.id}`}
                      checked={selected.has(item.id)}
                      onCheckedChange={(checked) => {
                        const next = new Set(selected);
                        if (checked === true) next.add(item.id);
                        else next.delete(item.id);
                        form.setValue('approvedItemIds', [...next]);
                      }}
                    />
                    <FieldLabel htmlFor={`quote-decide-item-${item.id}`} className="font-normal">
                      {item.procedureName}
                      {item.toothCode ? ` · dente ${item.toothCode}` : ''} ·{' '}
                      {formatCents(item.totalCents)}
                    </FieldLabel>
                  </div>
                ))}
                <FieldError>{form.formState.errors.approvedItemIds?.message}</FieldError>

                {decision === 'APPROVED' ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field data-invalid={Boolean(form.formState.errors.installments)}>
                      <FieldLabel htmlFor="quote-installments">Parcelas</FieldLabel>
                      <Input
                        id="quote-installments"
                        type="number"
                        min={1}
                        max={60}
                        {...form.register('installments', { valueAsNumber: true })}
                      />
                    </Field>
                    <Field data-invalid={Boolean(form.formState.errors.firstDueDate)}>
                      <FieldLabel htmlFor="quote-first-due">1º vencimento</FieldLabel>
                      <Input id="quote-first-due" type="date" {...form.register('firstDueDate')} />
                      <FieldError>{form.formState.errors.firstDueDate?.message}</FieldError>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="quote-down">Entrada (R$)</FieldLabel>
                      <Input id="quote-down" {...form.register('downPaymentReais')} />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="quote-method">Forma</FieldLabel>
                      <Input id="quote-method" {...form.register('method')} />
                    </Field>
                  </div>
                ) : (
                  <Field data-invalid={Boolean(form.formState.errors.reason)}>
                    <FieldLabel htmlFor="quote-reason">Motivo da recusa</FieldLabel>
                    <Textarea id="quote-reason" rows={3} {...form.register('reason')} />
                    <FieldError>{form.formState.errors.reason?.message}</FieldError>
                  </Field>
                )}
              </FieldGroup>

              {decide.isError ? (
                <Alert variant="destructive">
                  <AlertDescription>{operacionalErrorMessage(decide.error)}</AlertDescription>
                </Alert>
              ) : null}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                {decision === 'APPROVED' ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.setValue('decision', 'REJECTED')}
                  >
                    Recusar
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.setValue('decision', 'APPROVED')}
                  >
                    Voltar à aprovação
                  </Button>
                )}
                <Button type="submit" disabled={decide.isPending}>
                  {decide.isPending
                    ? 'Registrando…'
                    : decision === 'REJECTED'
                      ? 'Confirmar recusa'
                      : 'Aprovar'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </MotionDialogBody>
      </DialogContent>
    </Dialog>
  );
}
