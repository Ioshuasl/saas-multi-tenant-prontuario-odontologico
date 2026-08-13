'use client';

import { useAnamnesisFormHook } from '@/packages/public/hooks/Anamnesis/useAnamnesisFormHook';
import type { AnamnesisAnswersFormValues } from '@/packages/public/schemas/Anamnesis/AnamnesisSchema';
import type { AnamnesisQuestion } from '@/packages/public/types/Anamnesis/AnamnesisTypes';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { NativeSelect, NativeSelectOption } from '@/shared/ui/native-select';
import { Textarea } from '@/shared/ui/textarea';

type AnamnesisQuestionsProps = {
  questions: AnamnesisQuestion[];
  pending: boolean;
  errorMessage?: string | null;
  onSave: (values: AnamnesisAnswersFormValues) => void;
};

function booleanFromSelect(value: string): boolean | undefined {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function AnamnesisQuestions({
  questions,
  pending,
  errorMessage,
  onSave,
}: AnamnesisQuestionsProps) {
  const form = useAnamnesisFormHook(questions);

  return (
    <form
      className="grid gap-5"
      onSubmit={(event) => {
        void form.handleSubmit(onSave)(event);
      }}
    >
      <FieldGroup>
        {questions.map((question) => {
          const error = form.formState.errors[question.id];
          const errorMessageText =
            error && typeof error === 'object' && 'message' in error
              ? String(error.message ?? '')
              : error && typeof error === 'object' && 'value' in error
                ? String((error as { value?: { message?: string } }).value?.message ?? '')
                : undefined;

          if (question.type === 'BOOLEAN' || question.type === 'BOOLEAN_WITH_TEXT') {
            const current =
              question.type === 'BOOLEAN_WITH_TEXT'
                ? (form.watch(question.id) as { value?: boolean; text?: string } | undefined)
                : (form.watch(question.id) as boolean | undefined);
            const selected =
              question.type === 'BOOLEAN_WITH_TEXT'
                ? current && typeof current === 'object'
                  ? current.value
                  : undefined
                : current;
            const extraText =
              question.type === 'BOOLEAN_WITH_TEXT' && current && typeof current === 'object'
                ? (current.text ?? '')
                : '';

            return (
              <Field key={question.id} data-invalid={Boolean(error)}>
                <FieldLabel htmlFor={`anamnese-${question.id}`}>
                  {question.label}
                  {question.required ? ' *' : ''}
                </FieldLabel>
                <NativeSelect
                  id={`anamnese-${question.id}`}
                  value={selected === true ? 'true' : selected === false ? 'false' : ''}
                  onChange={(event) => {
                    const next = booleanFromSelect(event.target.value);
                    if (question.type === 'BOOLEAN_WITH_TEXT') {
                      form.setValue(
                        question.id,
                        { value: next, text: extraText },
                        { shouldValidate: true },
                      );
                      return;
                    }
                    form.setValue(question.id, next, { shouldValidate: true });
                  }}
                >
                  <NativeSelectOption value="">Selecione</NativeSelectOption>
                  <NativeSelectOption value="true">Sim</NativeSelectOption>
                  <NativeSelectOption value="false">Não</NativeSelectOption>
                </NativeSelect>
                {question.type === 'BOOLEAN_WITH_TEXT' && selected === true ? (
                  <Input
                    className="mt-2"
                    placeholder="Qual? (opcional)"
                    value={extraText}
                    onChange={(event) => {
                      form.setValue(
                        question.id,
                        { value: true, text: event.target.value },
                        { shouldValidate: true },
                      );
                    }}
                  />
                ) : null}
                <FieldError>{errorMessageText}</FieldError>
              </Field>
            );
          }

          if (question.type === 'SINGLE_CHOICE') {
            return (
              <Field key={question.id} data-invalid={Boolean(error)}>
                <FieldLabel htmlFor={`anamnese-${question.id}`}>
                  {question.label}
                  {question.required ? ' *' : ''}
                </FieldLabel>
                <NativeSelect
                  id={`anamnese-${question.id}`}
                  value={stringValue(form.watch(question.id))}
                  onChange={(event) => {
                    form.setValue(question.id, event.target.value, { shouldValidate: true });
                  }}
                >
                  <NativeSelectOption value="">Selecione</NativeSelectOption>
                  {(question.options ?? []).map((option) => (
                    <NativeSelectOption key={option} value={option}>
                      {option}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <FieldError>{errorMessageText}</FieldError>
              </Field>
            );
          }

          return (
            <Field key={question.id} data-invalid={Boolean(error)}>
              <FieldLabel htmlFor={`anamnese-${question.id}`}>
                {question.label}
                {question.required ? ' *' : ''}
              </FieldLabel>
              <Textarea id={`anamnese-${question.id}`} rows={3} {...form.register(question.id)} />
              <FieldError>{errorMessageText}</FieldError>
            </Field>
          );
        })}
      </FieldGroup>

      {errorMessage ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? 'Enviando…' : 'Enviar anamnese'}
      </Button>
    </form>
  );
}
