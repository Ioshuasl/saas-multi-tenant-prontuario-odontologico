'use client';

import Link from 'next/link';
import {
  ONBOARDING_STEP_HREFS,
  ONBOARDING_STEP_LABELS,
  ONBOARDING_STEPS,
} from '@/packages/admin/enum/OnboardingStepEnum';
import { adminErrorMessage } from '@/packages/admin/helpers/AdminErrorMessage';
import { useOnboardingGetHook } from '@/packages/admin/hooks/Onboarding/useOnboardingGetHook';
import { useOnboardingUpdateHook } from '@/packages/admin/hooks/Onboarding/useOnboardingUpdateHook';
import { cn } from '@/shared/helpers/utils';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';

export function OnboardingWizard() {
  const onboardingQuery = useOnboardingGetHook();
  const skip = useOnboardingUpdateHook();

  if (onboardingQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando…</p>;
  }

  if (onboardingQuery.isError || !onboardingQuery.data) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{adminErrorMessage(onboardingQuery.error)}</AlertDescription>
      </Alert>
    );
  }

  const status = onboardingQuery.data;

  return (
    <div className="mx-auto grid max-w-2xl gap-4">
      <h1 className="text-xl font-semibold">Onboarding</h1>
      <p className="text-sm text-muted-foreground">
        Configure a clínica para liberar o uso completo.
      </p>

      {status.completed ? (
        <Alert>
          <AlertDescription>
            Onboarding concluído. Link público:{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              {`${window.location.origin}/agendar/${status.publicBookingPath.split('/').filter(Boolean).pop() ?? ''}`}
            </code>
          </AlertDescription>
        </Alert>
      ) : null}

      <ul className="grid gap-3">
        {ONBOARDING_STEPS.map((step) => {
          const done = Boolean(status.stepsStatus[step]);
          const skipped = status.skippedSteps.includes(step);
          const required = status.requiredSteps.includes(step);
          const label = ONBOARDING_STEP_LABELS[step];
          const href = ONBOARDING_STEP_HREFS[step];

          let stateLabel = 'Pendente';
          if (done) stateLabel = 'Concluído';
          else if (skipped) stateLabel = 'Ignorado';

          return (
            <li
              key={step}
              className={cn(
                'flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3',
                done && 'border-green-600/40',
              )}
            >
              <div className="grid gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{label}</span>
                  {required ? (
                    <span className="text-xs text-muted-foreground">obrigatório</span>
                  ) : null}
                </div>
                <span className="text-xs text-muted-foreground">{stateLabel}</span>
              </div>
              <div className="flex gap-2">
                <Link
                  href={href}
                  className="inline-flex h-7 items-center rounded-lg border border-border bg-background px-2.5 text-[0.8rem] hover:bg-muted"
                >
                  Configurar
                </Link>
                {!done ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={skip.isPending}
                    onClick={() => skip.mutate({ skipStep: step })}
                  >
                    Pular
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      {skip.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{adminErrorMessage(skip.error)}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
