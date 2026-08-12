'use client';

import Link from 'next/link';
import { ONBOARDING_SUGGEST_BANNER_ID } from '@/packages/admin/helpers/StartOnboardingSuggestTour';
import { useOnboardingGetHook } from '@/packages/admin/hooks/Onboarding/useOnboardingGetHook';
import { useOnboardingSuggestTourHook } from '@/packages/admin/hooks/Onboarding/useOnboardingSuggestTourHook';
import { FadeIn } from '@/shared/motion/FadeIn';

export function OnboardingBanner() {
  const onboardingQuery = useOnboardingGetHook();
  const visible =
    !onboardingQuery.isLoading &&
    Boolean(onboardingQuery.data) &&
    !onboardingQuery.data?.completed;

  useOnboardingSuggestTourHook({ ready: visible });

  if (!visible) {
    return null;
  }

  return (
    <FadeIn>
      <div
        id={ONBOARDING_SUGGEST_BANNER_ID}
        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3"
      >
        <div className="grid gap-1">
          <p className="text-sm font-medium">Complete a configuração da clínica</p>
          <p className="text-xs text-muted-foreground">
            Há etapas pendentes no onboarding.
          </p>
        </div>
        <Link
          href="/app/onboarding"
          className="inline-flex h-8 items-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80"
        >
          Continuar onboarding
        </Link>
      </div>
    </FadeIn>
  );
}
