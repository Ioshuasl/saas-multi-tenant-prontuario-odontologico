'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { operacionalErrorMessage } from '@/packages/operacional/helpers/OperacionalErrorMessage';
import type { PatientUpdateFormValues } from '@/packages/operacional/schemas/Patient/PatientSchema';

export type PatientAutosaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

type UsePatientAutosaveHookOptions = {
  form: UseFormReturn<PatientUpdateFormValues>;
  enabled: boolean;
  save: (values: PatientUpdateFormValues) => Promise<unknown>;
  /** Pausa após a última tecla antes de salvar (padrão 800ms). */
  debounceMs?: number;
  /** Teto enquanto a pessoa continua digitando (padrão 5s). */
  maxWaitMs?: number;
};

/**
 * Debounce otimizado para ficha de paciente já persistida:
 * - trailing debounce após pausa na digitação
 * - maxWait para não perder muito se a digitação for contínua
 * - flush ao sair da aba/página (visibilitychange / pagehide)
 * - só envia se válido e dirty; gerações evitam resposta atrasada sobrescrever estado
 */
export function usePatientAutosaveHook({
  form,
  enabled,
  save,
  debounceMs = 800,
  maxWaitMs = 5000,
}: UsePatientAutosaveHookOptions) {
  const [status, setStatus] = useState<PatientAutosaveStatus>('idle');
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxWaitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstDirtyAt = useRef<number | null>(null);
  const generation = useRef(0);
  const inFlight = useRef(false);
  const saveRef = useRef(save);
  const formRef = useRef(form);

  saveRef.current = save;
  formRef.current = form;

  const clearTimers = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    if (maxWaitTimer.current) {
      clearTimeout(maxWaitTimer.current);
      maxWaitTimer.current = null;
    }
  }, []);

  const flush = useCallback(async () => {
    if (!enabled) return;
    clearTimers();
    firstDirtyAt.current = null;

    const current = formRef.current;
    if (!current.formState.isDirty) {
      setStatus((prev) => (prev === 'saving' ? prev : 'idle'));
      return;
    }

    const valid = await current.trigger();
    if (!valid) {
      setStatus('pending');
      return;
    }

    const values = current.getValues();
    const gen = ++generation.current;
    inFlight.current = true;
    setStatus('saving');
    setErrorMessage(null);

    try {
      await saveRef.current(values);
      if (gen !== generation.current) return;
      current.reset(values, { keepValues: true });
      setSavedAt(new Date());
      setStatus('saved');
    } catch (error) {
      if (gen !== generation.current) return;
      setStatus('error');
      setErrorMessage(operacionalErrorMessage(error));
    } finally {
      if (gen === generation.current) inFlight.current = false;
    }
  }, [clearTimers, enabled]);

  const schedule = useCallback(() => {
    if (!enabled) return;
    if (!formRef.current.formState.isDirty) return;

    setStatus((prev) => (prev === 'saving' ? prev : 'pending'));
    const now = Date.now();
    if (firstDirtyAt.current == null) {
      firstDirtyAt.current = now;
      maxWaitTimer.current = setTimeout(() => {
        void flush();
      }, maxWaitMs);
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      void flush();
    }, debounceMs);
  }, [debounceMs, enabled, flush, maxWaitMs]);

  useEffect(() => {
    if (!enabled) return;
    const subscription = form.watch(() => {
      schedule();
    });
    return () => subscription.unsubscribe();
  }, [enabled, form, schedule]);

  useEffect(() => {
    if (!enabled) return;

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        void flush();
      }
    };
    const onPageHide = () => {
      void flush();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
      clearTimers();
    };
  }, [clearTimers, enabled, flush]);

  return {
    status,
    savedAt,
    errorMessage,
    flush,
    retry: flush,
  };
}
