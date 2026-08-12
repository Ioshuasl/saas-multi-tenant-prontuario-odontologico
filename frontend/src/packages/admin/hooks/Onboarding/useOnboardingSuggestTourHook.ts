'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { startOnboardingSuggestTour } from '@/packages/admin/helpers/StartOnboardingSuggestTour';
import { hasOnboardingSuggest } from '@/shared/helpers/onboarding-suggest-flag';

type UseOnboardingSuggestTourHookInput = {
  ready: boolean;
};

export function useOnboardingSuggestTourHook({ ready }: UseOnboardingSuggestTourHookInput) {
  const router = useRouter();
  const startedRef = useRef(false);

  useEffect(() => {
    if (!ready || startedRef.current || !hasOnboardingSuggest()) return;

    let stop: (() => void) | null = null;
    let cancelled = false;

    void (async () => {
      stop = await startOnboardingSuggestTour({
        onOpenWizard: () => {
          router.push('/app/onboarding');
        },
      });
      if (cancelled) {
        stop?.();
        return;
      }
      if (stop) {
        startedRef.current = true;
      }
    })();

    return () => {
      cancelled = true;
      stop?.();
    };
  }, [ready, router]);
}
