'use client';

import { useDeferredValue, useEffect, useState } from 'react';
import { useFieldArray } from 'react-hook-form';
import { TOOTH_FACES } from '@/packages/operacional/enum/Quote/ToothFaceEnum';
import { formatCents } from '@/packages/operacional/helpers/FormatCents';
import { operacionalErrorMessage } from '@/packages/operacional/helpers/OperacionalErrorMessage';
import { useAgendaProfessionalListHook } from '@/packages/operacional/hooks/Appointment/useAgendaProfessionalListHook';
import { usePatientListHook } from '@/packages/operacional/hooks/Patient/usePatientListHook';
import { useQuoteCreateHook } from '@/packages/operacional/hooks/Quote/useQuoteCreateHook';
import {
  useQuoteCreateFormHook,
  useQuoteItemAddFormHook,
  useQuoteUpdateFormHook,
} from '@/packages/operacional/hooks/Quote/useQuoteFormHook';
import { useQuoteGetHook } from '@/packages/operacional/hooks/Quote/useQuoteGetHook';
import { useQuoteItemCreateHook } from '@/packages/operacional/hooks/Quote/useQuoteItemCreateHook';
import { useQuoteItemDeleteHook } from '@/packages/operacional/hooks/Quote/useQuoteItemDeleteHook';
import { useQuoteProcedureListHook } from '@/packages/operacional/hooks/Quote/useQuoteProcedureListHook';
import { useQuoteUpdateHook } from '@/packages/operacional/hooks/Quote/useQuoteUpdateHook';
import {
  toQuoteCreatePayload,
  toQuoteItemPayload,
  type QuoteCreateFormValues,
  type QuoteItemAddFormValues,
  type QuoteUpdateFormValues,
} from '@/packages/operacional/schemas/Quote/QuoteSchema';
import type { QuoteFormDialogProps } from '@/packages/operacional/types/Quote/QuoteFormDialogTypes';
import { useAuth } from '@/shared/auth/AuthProvider';
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
import { Field, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { NativeSelect, NativeSelectOption } from '@/shared/ui/native-select';
import { Textarea } from '@/shared/ui/textarea';

export function QuoteFormDialog({ open, quoteId, patientId, onClose }: QuoteFormDialogProps) {
  const isEdit = Boolean(quoteId);
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <MotionDialogBody>
          {isEdit && quoteId ? (
            <QuoteEditForm quoteId={quoteId} onClose={onClose} />
          ) : (
            <QuoteCreateForm patientId={patientId} onClose={onClose} />
          )}
        </MotionDialogBody>
      </DialogContent>
    </Dialog>
  );
}

function QuoteCreateForm({
  patientId,
  onClose,
}: {
  patientId?: string;
  onClose: () => void;
}) {
  const { me } = useAuth();
  const form = useQuoteCreateFormHook(patientId);
  const create = useQuoteCreateHook();
  const professionalsQuery = useAgendaProfessionalListHook();
  const proceduresQuery = useQuoteProcedureListHook();
  const [patientSearch, setPatientSearch] = useState('');
  const deferredSearch = useDeferredValue(patientSearch);
  const patientsQuery = usePatientListHook(deferredSearch);
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' });
  const receptionLocked = me?.current.role === 'RECEPTION';

  useEffect(() => {
    form.reset({
      patientId: patientId ?? '',
      professionalId: '',
      validUntil: '',
      notes: '',
      discountCents: 0,
      items: [{ procedureId: '', toothCode: '', face: '', quantity: 1, discountCents: 0 }],
    });
  }, [patientId, form]);

  const onSave = async (values: QuoteCreateFormValues) => {
    await create.mutateAsync(toQuoteCreatePayload(values));
    onClose();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Novo orçamento</DialogTitle>
      </DialogHeader>
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          void form.handleSubmit(onSave)(event);
        }}
      >
        <FieldGroup>
          {!patientId ? (
            <>
              <Field>
                <FieldLabel htmlFor="quote-patient-search">Buscar paciente</FieldLabel>
                <Input
                  id="quote-patient-search"
                  value={patientSearch}
                  onChange={(event) => setPatientSearch(event.target.value)}
                  placeholder="Nome, telefone ou ficha"
                />
              </Field>
              <Field data-invalid={Boolean(form.formState.errors.patientId)}>
                <FieldLabel htmlFor="quote-patient">Paciente</FieldLabel>
                <NativeSelect
                  id="quote-patient"
                  value={form.watch('patientId')}
                  onChange={(event) =>
                    form.setValue('patientId', event.target.value, { shouldValidate: true })
                  }
                >
                  <NativeSelectOption value="">Selecione</NativeSelectOption>
                  {(patientsQuery.data?.items ?? []).map((patient) => (
                    <NativeSelectOption key={patient.id} value={patient.id}>
                      {patient.socialName || patient.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <FieldError>{form.formState.errors.patientId?.message}</FieldError>
              </Field>
            </>
          ) : null}

          <Field data-invalid={Boolean(form.formState.errors.professionalId)}>
            <FieldLabel htmlFor="quote-professional">Profissional</FieldLabel>
            <NativeSelect
              id="quote-professional"
              value={form.watch('professionalId')}
              onChange={(event) =>
                form.setValue('professionalId', event.target.value, { shouldValidate: true })
              }
            >
              <NativeSelectOption value="">Selecione</NativeSelectOption>
              {(professionalsQuery.data ?? []).map((professional) => (
                <NativeSelectOption key={professional.id} value={professional.id}>
                  {professional.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <FieldError>{form.formState.errors.professionalId?.message}</FieldError>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="quote-valid-until">Validade</FieldLabel>
              <Input id="quote-valid-until" type="date" {...form.register('validUntil')} />
            </Field>
            <Field>
              <FieldLabel htmlFor="quote-discount">Desconto (centavos)</FieldLabel>
              <Input
                id="quote-discount"
                type="number"
                min={0}
                disabled={receptionLocked}
                {...form.register('discountCents', { valueAsNumber: true })}
              />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="quote-notes">Observações comerciais</FieldLabel>
            <Textarea id="quote-notes" rows={2} {...form.register('notes')} />
          </Field>
        </FieldGroup>

        <div className="grid gap-3">
          <p className="text-sm font-medium">Itens</p>
          {fields.map((field, index) => {
            const procedureId = form.watch(`items.${index}.procedureId`);
            const procedure = (proceduresQuery.data ?? []).find((item) => item.id === procedureId);
            return (
              <div key={field.id} className="grid gap-3 rounded-md border p-3">
                <Field data-invalid={Boolean(form.formState.errors.items?.[index]?.procedureId)}>
                  <FieldLabel htmlFor={`quote-item-procedure-${index}`}>Procedimento</FieldLabel>
                  <NativeSelect
                    id={`quote-item-procedure-${index}`}
                    value={procedureId}
                    onChange={(event) =>
                      form.setValue(`items.${index}.procedureId`, event.target.value, {
                        shouldValidate: true,
                      })
                    }
                  >
                    <NativeSelectOption value="">Selecione</NativeSelectOption>
                    {(proceduresQuery.data ?? []).map((item) => (
                      <NativeSelectOption key={item.id} value={item.id}>
                        {item.name} · {formatCents(item.priceCents)}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                  <FieldError>{form.formState.errors.items?.[index]?.procedureId?.message}</FieldError>
                </Field>
                <div className="grid gap-3 sm:grid-cols-3">
                  {procedure?.requiresTooth ? (
                    <Field>
                      <FieldLabel htmlFor={`quote-item-tooth-${index}`}>Dente</FieldLabel>
                      <Input
                        id={`quote-item-tooth-${index}`}
                        maxLength={2}
                        {...form.register(`items.${index}.toothCode`)}
                      />
                    </Field>
                  ) : null}
                  {procedure?.requiresFace ? (
                    <Field>
                      <FieldLabel htmlFor={`quote-item-face-${index}`}>Face</FieldLabel>
                      <NativeSelect
                        id={`quote-item-face-${index}`}
                        value={form.watch(`items.${index}.face`) ?? ''}
                        onChange={(event) =>
                          form.setValue(
                            `items.${index}.face`,
                            event.target.value as QuoteCreateFormValues['items'][number]['face'],
                          )
                        }
                      >
                        <NativeSelectOption value="">—</NativeSelectOption>
                        {TOOTH_FACES.map((face) => (
                          <NativeSelectOption key={face} value={face}>
                            {face}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    </Field>
                  ) : null}
                  <Field>
                    <FieldLabel htmlFor={`quote-item-qty-${index}`}>Qtd</FieldLabel>
                    <Input
                      id={`quote-item-qty-${index}`}
                      type="number"
                      min={1}
                      {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                    />
                  </Field>
                </div>
                {fields.length > 1 ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                    Remover
                  </Button>
                ) : null}
              </div>
            );
          })}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              append({ procedureId: '', toothCode: '', face: '', quantity: 1, discountCents: 0 })
            }
          >
            Adicionar item
          </Button>
        </div>

        {create.isError ? (
          <Alert variant="destructive">
            <AlertDescription>{operacionalErrorMessage(create.error)}</AlertDescription>
          </Alert>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? 'Salvando…' : 'Criar'}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

function QuoteEditForm({ quoteId, onClose }: { quoteId: string; onClose: () => void }) {
  const { me } = useAuth();
  const quoteQuery = useQuoteGetHook(quoteId);
  const form = useQuoteUpdateFormHook();
  const itemForm = useQuoteItemAddFormHook();
  const update = useQuoteUpdateHook(quoteId);
  const addItem = useQuoteItemCreateHook(quoteId);
  const removeItem = useQuoteItemDeleteHook(quoteId);
  const proceduresQuery = useQuoteProcedureListHook();
  const receptionLocked = me?.current.role === 'RECEPTION';

  useEffect(() => {
    const quote = quoteQuery.data;
    if (!quote) return;
    form.reset({
      validUntil: quote.validUntil ?? '',
      notes: quote.notes ?? '',
      discountCents: quote.discountCents,
    });
  }, [quoteQuery.data, form]);

  const onSave = async (values: QuoteUpdateFormValues) => {
    await update.mutateAsync({
      validUntil: values.validUntil?.trim() ? values.validUntil : null,
      notes: values.notes?.trim() ? values.notes : null,
      discountCents: values.discountCents,
    });
    onClose();
  };

  const onAddItem = async (values: QuoteItemAddFormValues) => {
    await addItem.mutateAsync(toQuoteItemPayload(values));
    itemForm.reset({ procedureId: '', toothCode: '', face: '', quantity: 1, discountCents: 0 });
  };

  const quote = quoteQuery.data;
  const addProcedureId = itemForm.watch('procedureId');
  const addProcedure = (proceduresQuery.data ?? []).find((item) => item.id === addProcedureId);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Editar orçamento {quote?.number ? `nº ${quote.number}` : ''}</DialogTitle>
      </DialogHeader>
      {quoteQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            void form.handleSubmit(onSave)(event);
          }}
        >
          {quote?.validUntil ? (
            <Alert>
              <AlertDescription>Validade: {quote.validUntil}. Totais calculados no servidor.</AlertDescription>
            </Alert>
          ) : null}
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="quote-edit-valid">Validade</FieldLabel>
                <Input id="quote-edit-valid" type="date" {...form.register('validUntil')} />
              </Field>
              <Field>
                <FieldLabel htmlFor="quote-edit-discount">Desconto (centavos)</FieldLabel>
                <Input
                  id="quote-edit-discount"
                  type="number"
                  min={0}
                  disabled={receptionLocked}
                  {...form.register('discountCents', { valueAsNumber: true })}
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="quote-edit-notes">Observações comerciais</FieldLabel>
              <Textarea id="quote-edit-notes" rows={2} {...form.register('notes')} />
            </Field>
          </FieldGroup>

          <div className="grid gap-2">
            <p className="text-sm font-medium">Itens</p>
            {(quote?.items ?? []).map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
                <span>
                  {item.procedureName}
                  {item.toothCode ? ` · dente ${item.toothCode}` : ''}
                  {item.face ? ` ${item.face}` : ''} · {formatCents(item.totalCents)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={removeItem.isPending}
                  onClick={() => void removeItem.mutateAsync(item.id)}
                >
                  Remover
                </Button>
              </div>
            ))}
          </div>

          <div className="grid gap-3 rounded-md border p-3">
            <p className="text-sm font-medium">Adicionar item</p>
            <Field>
              <FieldLabel htmlFor="quote-add-procedure">Procedimento</FieldLabel>
              <NativeSelect
                id="quote-add-procedure"
                value={addProcedureId}
                onChange={(event) => itemForm.setValue('procedureId', event.target.value)}
              >
                <NativeSelectOption value="">Selecione</NativeSelectOption>
                {(proceduresQuery.data ?? []).map((item) => (
                  <NativeSelectOption key={item.id} value={item.id}>
                    {item.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            {addProcedure?.requiresTooth ? (
              <Field>
                <FieldLabel htmlFor="quote-add-tooth">Dente</FieldLabel>
                <Input id="quote-add-tooth" maxLength={2} {...itemForm.register('toothCode')} />
              </Field>
            ) : null}
            <Button
              type="button"
              variant="outline"
              disabled={addItem.isPending}
              onClick={() => void itemForm.handleSubmit(onAddItem)()}
            >
              Incluir item
            </Button>
          </div>

          {update.isError || addItem.isError || removeItem.isError ? (
            <Alert variant="destructive">
              <AlertDescription>
                {operacionalErrorMessage(update.error ?? addItem.error ?? removeItem.error)}
              </AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      )}
    </>
  );
}
