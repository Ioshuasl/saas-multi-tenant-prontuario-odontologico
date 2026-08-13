'use client';

import { useEffect } from 'react';
import { useFieldArray } from 'react-hook-form';
import { ALERT_CATEGORIES, ALERT_CATEGORY_LABELS } from '@/packages/admin/enum/AnamnesisForm/AlertCategoryEnum';
import { ALERT_SEVERITIES, ALERT_SEVERITY_LABELS } from '@/packages/admin/enum/AnamnesisForm/AlertSeverityEnum';
import { QUESTION_TYPES, QUESTION_TYPE_LABELS } from '@/packages/admin/enum/AnamnesisForm/QuestionTypeEnum';
import { adminErrorMessage } from '@/packages/admin/helpers/AdminErrorMessage';
import { useAnamnesisFormCreateHook } from '@/packages/admin/hooks/AnamnesisForm/useAnamnesisFormCreateHook';
import { useAnamnesisFormFormHook } from '@/packages/admin/hooks/AnamnesisForm/useAnamnesisFormFormHook';
import {
  EMPTY_ANAMNESIS_QUESTION,
  anamnesisFormToFormValues,
  type AnamnesisFormCreateFormValues,
} from '@/packages/admin/schemas/AnamnesisForm/AnamnesisFormSchema';
import type { AnamnesisFormFormDialogProps } from '@/packages/admin/types/AnamnesisForm/AnamnesisFormFormDialogTypes';
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

export function AnamnesisFormFormDialog({ source, onClose }: AnamnesisFormFormDialogProps) {
  const form = useAnamnesisFormFormHook(source ? anamnesisFormToFormValues(source) : undefined);
  const create = useAnamnesisFormCreateHook();
  const questions = useFieldArray({ control: form.control, name: 'questions' });

  useEffect(() => {
    if (!source) return;
    form.reset(anamnesisFormToFormValues(source));
  }, [source, form]);

  const onSave = async (values: AnamnesisFormCreateFormValues) => {
    await create.mutateAsync(values);
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <MotionDialogBody>
          <DialogHeader>
            <DialogTitle>Nova versão da anamnese</DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              void form.handleSubmit(onSave)(event);
            }}
          >
            <FieldGroup>
              <Field data-invalid={Boolean(form.formState.errors.name)}>
                <FieldLabel htmlFor="anamnesis-form-name">Nome</FieldLabel>
                <Input id="anamnesis-form-name" {...form.register('name')} />
                <FieldError>{form.formState.errors.name?.message}</FieldError>
              </Field>
            </FieldGroup>

            {questions.fields.map((field, index) => {
              const type = form.watch(`questions.${index}.type`);
              const alertMode = form.watch(`questions.${index}.alertMode`);
              return (
                <div key={field.id} className="grid gap-3 rounded-md border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">Pergunta {index + 1}</p>
                    {questions.fields.length > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => questions.remove(index)}
                      >
                        Remover
                      </Button>
                    ) : null}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field data-invalid={Boolean(form.formState.errors.questions?.[index]?.id)}>
                      <FieldLabel htmlFor={`q-${index}-id`}>Id</FieldLabel>
                      <Input id={`q-${index}-id`} {...form.register(`questions.${index}.id`)} />
                      <FieldError>{form.formState.errors.questions?.[index]?.id?.message}</FieldError>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor={`q-${index}-type`}>Tipo</FieldLabel>
                      <NativeSelect
                        id={`q-${index}-type`}
                        value={type}
                        onChange={(event) => {
                          form.setValue(
                            `questions.${index}.type`,
                            event.target.value as AnamnesisFormCreateFormValues['questions'][number]['type'],
                          );
                        }}
                      >
                        {QUESTION_TYPES.map((item) => (
                          <NativeSelectOption key={item} value={item}>
                            {QUESTION_TYPE_LABELS[item]}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    </Field>
                  </div>
                  <Field data-invalid={Boolean(form.formState.errors.questions?.[index]?.label)}>
                    <FieldLabel htmlFor={`q-${index}-label`}>Pergunta</FieldLabel>
                    <Input id={`q-${index}-label`} {...form.register(`questions.${index}.label`)} />
                    <FieldError>{form.formState.errors.questions?.[index]?.label?.message}</FieldError>
                  </Field>
                  {type === 'SINGLE_CHOICE' ? (
                    <Field>
                      <FieldLabel htmlFor={`q-${index}-options`}>Opções (separadas por vírgula)</FieldLabel>
                      <Textarea id={`q-${index}-options`} rows={2} {...form.register(`questions.${index}.optionsText`)} />
                    </Field>
                  ) : null}
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" {...form.register(`questions.${index}.required`)} />
                    Obrigatória
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor={`q-${index}-alert-mode`}>Alerta automático</FieldLabel>
                      <NativeSelect
                        id={`q-${index}-alert-mode`}
                        value={alertMode}
                        onChange={(event) => {
                          form.setValue(
                            `questions.${index}.alertMode`,
                            event.target.value as AnamnesisFormCreateFormValues['questions'][number]['alertMode'],
                          );
                        }}
                      >
                        <NativeSelectOption value="none">Nenhum</NativeSelectOption>
                        <NativeSelectOption value="equals">Quando igual a</NativeSelectOption>
                        <NativeSelectOption value="notEquals">Quando diferente de</NativeSelectOption>
                      </NativeSelect>
                    </Field>
                    {alertMode !== 'none' ? (
                      <Field>
                        <FieldLabel htmlFor={`q-${index}-alert-value`}>Valor (true/false ou texto)</FieldLabel>
                        <Input id={`q-${index}-alert-value`} {...form.register(`questions.${index}.alertValue`)} />
                      </Field>
                    ) : null}
                  </div>
                  {alertMode !== 'none' ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor={`q-${index}-severity`}>Severidade</FieldLabel>
                        <NativeSelect
                          id={`q-${index}-severity`}
                          value={form.watch(`questions.${index}.alertSeverity`)}
                          onChange={(event) => {
                            form.setValue(
                              `questions.${index}.alertSeverity`,
                              event.target.value as AnamnesisFormCreateFormValues['questions'][number]['alertSeverity'],
                            );
                          }}
                        >
                          {ALERT_SEVERITIES.map((item) => (
                            <NativeSelectOption key={item} value={item}>
                              {ALERT_SEVERITY_LABELS[item]}
                            </NativeSelectOption>
                          ))}
                        </NativeSelect>
                      </Field>
                      <Field>
                        <FieldLabel htmlFor={`q-${index}-category`}>Categoria</FieldLabel>
                        <NativeSelect
                          id={`q-${index}-category`}
                          value={form.watch(`questions.${index}.alertCategory`)}
                          onChange={(event) => {
                            form.setValue(
                              `questions.${index}.alertCategory`,
                              event.target.value as AnamnesisFormCreateFormValues['questions'][number]['alertCategory'],
                            );
                          }}
                        >
                          {ALERT_CATEGORIES.map((item) => (
                            <NativeSelectOption key={item} value={item}>
                              {ALERT_CATEGORY_LABELS[item]}
                            </NativeSelectOption>
                          ))}
                        </NativeSelect>
                      </Field>
                    </div>
                  ) : null}
                  <Field>
                    <FieldLabel htmlFor={`q-${index}-gender`}>Exibir só se sexo (opcional)</FieldLabel>
                    <Input
                      id={`q-${index}-gender`}
                      placeholder="F"
                      {...form.register(`questions.${index}.showWhenGender`)}
                    />
                  </Field>
                </div>
              );
            })}

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                questions.append({
                  ...EMPTY_ANAMNESIS_QUESTION,
                  id: `pergunta_${questions.fields.length + 1}`,
                })
              }
            >
              Adicionar pergunta
            </Button>

            {form.formState.errors.questions?.message ? (
              <Alert variant="destructive">
                <AlertDescription>{form.formState.errors.questions.message}</AlertDescription>
              </Alert>
            ) : null}
            {create.isError ? (
              <Alert variant="destructive">
                <AlertDescription>{adminErrorMessage(create.error)}</AlertDescription>
              </Alert>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? 'Salvando…' : 'Publicar versão'}
              </Button>
            </DialogFooter>
          </form>
        </MotionDialogBody>
      </DialogContent>
    </Dialog>
  );
}
