'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { AppHeader } from '@/packages/admin/components/Layout/AppHeader';
import { AppSidebar } from '@/packages/admin/components/Layout/AppSidebar';
import { ClivraShellProvider } from '@/packages/admin/components/Layout/ClivraShellContext';
import { SubscriptionBanner } from '@/packages/admin/components/Subscription/SubscriptionBanner';
import { useClinicGetHook } from '@/packages/admin/hooks/Clinic/useClinicGetHook';
import { useAuth } from '@/shared/auth/AuthProvider';
import { Skeleton } from '@/shared/ui/skeleton';
import { TooltipProvider } from '@/shared/ui/tooltip';

type AppShellProps = {
  children: ReactNode;
  inboxBadgeCount?: number;
};

export function AppShell({ children, inboxBadgeCount = 0 }: AppShellProps) {
  const { ready, isAuthenticated } = useAuth();
  const router = useRouter();
  const clinicQuery = useClinicGetHook({ enabled: ready && isAuthenticated });

  useEffect(() => {
    if (ready && !isAuthenticated) {
      router.replace('/login');
    }
  }, [ready, isAuthenticated, router]);

  if (!ready || !isAuthenticated) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background p-6">
        <Skeleton className="h-8 w-40" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <ClivraShellProvider>
        <div className="flex min-h-svh w-full min-w-0 bg-background">
          <AppSidebar clinicName={clinicQuery.data?.name} inboxBadgeCount={inboxBadgeCount} />
          <div className="flex min-w-0 flex-1 flex-col">
            <AppHeader />
            <main className="mx-auto flex w-full min-w-0 max-w-[1440px] flex-1 flex-col gap-4 bg-background p-4 sm:p-6 desk:max-w-[1440px] desk:px-8 desk:py-6">
              <SubscriptionBanner />
              {children}
            </main>
          </div>
        </div>
      </ClivraShellProvider>
    </TooltipProvider>
  );
}
